import db from "../db/db";
import { DuplicateLinkError } from "../errors/documentError";
import { Utility } from "../utilities";

class DocumentDAO {
  private getDocumentTypeId(documentType: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const getDocTypeId = `SELECT documentTypeId FROM DocumentType WHERE documentTypeName = ?`;
      db.get(getDocTypeId, [documentType], (err: Error | null, row: any) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          return reject(new Error("Invalid documentType"));
        }
        resolve(row.documentTypeId);
      });
    });
  }

  private getNodeTypeId(nodeType: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const getNodeTypeId = `SELECT nodeTypeId FROM NodeType WHERE nodeTypeName = ?`;
      db.get(getNodeTypeId, [nodeType], (err: Error | null, row: any) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          return reject(new Error("Invalid nodeType"));
        }
        resolve(row.nodeTypeId);
      });
    });
  }

  async createDocument(
    title: string,
    description: string,
    documentType: string,
    scale: string,
    nodeType: string,
    stakeholders: string[],
    issuanceDate: string | null,
    language: string | null,
    pages: string | null,
    georeference: string[] | null,
    georeferenceName: string | null,
    areaColor: string | null
  ): Promise<any> {
    try {
      const documentTypeId = await this.getDocumentTypeId(documentType);
      const nodeTypeId = await this.getNodeTypeId(nodeType);

      return new Promise<any>((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          const insertGeoreference = (): Promise<number | null> => {
            return new Promise((resolveGeo, rejectGeo) => {
              if (georeference) {
                const coordinates = JSON.stringify(georeference);
                const isArea = georeference.length > 1;
                const georeferenceIdSql = `SELECT MAX(georeferenceId) AS georeferenceId FROM Georeference`;
                const insertGeoSql = `
                    INSERT INTO Georeference (georeferenceId, coordinates, georeferenceName, isArea, areaColor)
                    VALUES (?, ?, ?, ?, ?)
                  `;
                db.get(georeferenceIdSql, (err: Error | null, row: any) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return rejectGeo(err);
                  }
                  const georeferenceId = row.georeferenceId ? row.georeferenceId + 1 : 1;
                  const name = georeferenceName ? georeferenceName : "geo" + georeferenceId;
                  db.run(
                    insertGeoSql,
                    [georeferenceId, coordinates, name, isArea, areaColor],
                    function (err) {
                      if (err) {
                        db.run("ROLLBACK");
                        return rejectGeo(err);
                      }
                      resolveGeo(georeferenceId);
                    }
                  );
                });
              } else {
                resolveGeo(null);
              }
            });
          };

          insertGeoreference()
            .then((georeferenceId) => {
              const documentIdSql = `SELECT MAX(documentId) AS documentId FROM Document`;
              const insertDocumentSql = `
                  INSERT INTO Document 
                  (documentId, title, description, documentTypeId, scale, nodeTypeId, issuanceDate, language, pages, georeferenceId)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
              db.get(documentIdSql, (err: Error | null, row: any) => {
                if (err) return reject(err);
                const documentId = row.documentId ? row.documentId + 1 : 1;
                db.run(
                  insertDocumentSql,
                  [
                    documentId,
                    title,
                    description,
                    documentTypeId,
                    scale,
                    nodeTypeId,
                    issuanceDate,
                    language,
                    pages,
                    georeferenceId,
                  ],
                  function (err) {
                    if (err) {
                      db.run("ROLLBACK");
                      return reject(err);
                    }

                    const insertStakeholder = (index: number) => {
                      if (index >= stakeholders.length) {
                        db.run("COMMIT", (err) => {
                          if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                          }
                          resolve({
                            status: 201,
                            documentId: documentId,
                            message: "Document created successfully",
                          });
                        });
                        return;
                      }

                      const stakeholderName = stakeholders[index];
                      const getStakeholderId = `SELECT stakeholderId FROM Stakeholder WHERE stakeholderName = ?`;
                      db.get(
                        getStakeholderId,
                        [stakeholderName],
                        (err: Error | null, stakeholderRow: any) => {
                          if (err || !stakeholderRow) {
                            db.run("ROLLBACK");
                            return reject(new Error(`Invalid stakeholder: ${stakeholderName}`));
                          }
                          const stakeholderId = stakeholderRow.stakeholderId;
                          const insertDocStakeSql = `INSERT INTO DocumentStakeholders (documentId, stakeholderId) VALUES (?, ?)`;
                          db.run(insertDocStakeSql, [documentId, stakeholderId], (err) => {
                            if (err) {
                              db.run("ROLLBACK");
                              return reject(err);
                            }
                            insertStakeholder(index + 1);
                          });
                        }
                      );
                    };

                    insertStakeholder(0);
                  }
                );
              });
            })
            .catch(reject);
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  linkDocuments(documentId1: number, documentId2: number, linkType: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const sql = "INSERT INTO DocumentConnections VALUES (?,?,?)";

        linkType = Utility.emptyFixer(linkType);

        db.run(sql, [documentId1, documentId2, linkType], (err: any) => {
          if (err) {
            if (err.errno === 19) reject(new DuplicateLinkError());
            else reject(err);
          } else resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDocuments(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `
        SELECT 
          D.documentId,
          D.title,
          D.description,
          DT.documentTypeName,
          D.scale,
          NT.nodeTypeName,
          D.issuanceDate,
          D.language,
          D.pages,
          G.georeferenceId,
          G.coordinates,
          G.georeferenceName,
          G.isArea,
          GROUP_CONCAT(S.stakeholderName) AS stakeholders
        FROM Document D
        JOIN DocumentType DT ON D.documentTypeId = DT.documentTypeId
        JOIN NodeType NT ON D.nodeTypeId = NT.nodeTypeId
        LEFT JOIN Georeference G ON D.georeferenceId = G.georeferenceId
        LEFT JOIN DocumentStakeholders DS ON D.documentId = DS.documentId
        LEFT JOIN Stakeholder S ON DS.stakeholderId = S.stakeholderId
        GROUP BY D.documentId
      `;

      db.all(sql, [], (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }

        const documents = rows.map((row) => ({
          documentId: row.documentId,
          title: row.title,
          description: row.description,
          documentType: row.documentTypeName,
          scale: row.scale,
          nodeType: row.nodeTypeName,
          issuanceDate: row.issuanceDate,
          language: row.language,
          pages: row.pages,
          georeferenceId: row.georeferenceId,
          coordinates: row.coordinates,
          stakeholders: row.stakeholders
            ? JSON.stringify(row.stakeholders.split(",").map((stake: string) => stake.trim()))
            : "[]",
        }));

        resolve(documents);
      });
    });
  }

  getConnectionDetailsByDocumentId(documentId: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const sql = `
        SELECT DISTINCT D.documentId, D.title, DC.connection
        FROM DocumentConnections DC
        JOIN Document D ON (DC.documentId1 = D.documentId OR DC.documentId2 = D.documentId)
        WHERE (DC.documentId1 = ? OR DC.documentId2 = ?) AND D.documentId != ?
      `;

      db.all(sql, [documentId, documentId, documentId], (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async getDocumentById(documentId: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const sql = `
        SELECT 
          D.documentId,
          D.title,
          D.description,
          DT.documentTypeName,
          D.scale,
          NT.nodeTypeName,
          D.issuanceDate,
          D.language,
          D.pages,
          G.georeferenceId,
          G.coordinates,
          G.georeferenceName,
          G.isArea,
          GROUP_CONCAT(S.stakeholderName) AS stakeholders
        FROM Document D
        JOIN DocumentType DT ON D.documentTypeId = DT.documentTypeId
        JOIN NodeType NT ON D.nodeTypeId = NT.nodeTypeId
        LEFT JOIN Georeference G ON D.georeferenceId = G.georeferenceId
        LEFT JOIN DocumentStakeholders DS ON D.documentId = DS.documentId
        LEFT JOIN Stakeholder S ON DS.stakeholderId = S.stakeholderId
        WHERE D.documentId = ?
        GROUP BY D.documentId
      `;

      db.get(sql, [documentId], (err: Error | null, row: any) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          return resolve(null);
        }

        const document = {
          documentId: row.documentId,
          title: row.title,
          description: row.description,
          documentType: row.documentTypeName,
          scale: row.scale,
          nodeType: row.nodeTypeName,
          issuanceDate: row.issuanceDate,
          language: row.language,
          pages: row.pages,
          coordinates: row.coordinates,
          stakeholders: row.stakeholders
            ? JSON.stringify(row.stakeholders.split(",").map((stake: string) => stake.trim()))
            : "[]",
        };

        resolve(document);
      });
    });
  }

  georeferenceDocument(documentId: number, georeference: string[]): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const georeferenceIdSql = "SELECT MAX(georeferenceId) AS georeferenceId FROM Georeference";
        const updateDocumentSql = "UPDATE Document SET georeferenceId=? WHERE documentId=?";
        const createGeoreferenceSql = "INSERT INTO Georeference VALUES (?, ?, ?, ?)";
        db.get(georeferenceIdSql, (err: Error | null, row: any) => {
          if (err) return reject(err);
          const georeferenceId = row.georeferenceId ? row.georeferenceId + 1 : 1;
          const isArea = georeference.length > 2;
          const georeferenceName = "geo" + georeferenceId;
          db.run(
            createGeoreferenceSql,
            [georeferenceId, JSON.stringify(georeference), georeferenceName, isArea],
            (err: Error | null) => {
              if (err) return reject(err);
              db.run(updateDocumentSql, [georeferenceId, documentId], (err: Error | null) => {
                if (err) reject(err);
                else resolve(true);
              });
            }
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Solution for duplicates in Georeference table
   * Sort coordinates list for areas before inserting in table
   * Check for already existing georeference in table with findGeoreference (sort coordinate list before search)
   * If match is found reuse the returned georeferenceId
   * If match is not found insert new georeference
   *
   * Possibly add counter to Georeference table to keep track of number of documents using each georeference
   * If one record reaches 0 documents can be deleted
   */
  findGeoreference(georeference: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const georeferenceIdSql = "SELECT georeferenceId FROM Georeference WHERE coordinates=?";
        db.get(georeferenceIdSql, [georeference], (err: Error | null, row: any) => {
          if (err) return reject(err);
          resolve(row.georeferenceId);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Algorithm for clockwise check
   * It may not work in some situations, it's not mathematically proven
   */
  clockwiseCheck(coordinates: string): boolean {
    let count = 0,
      i = 0;
    let angles: number[];
    const coordinateArray: number[][] = JSON.parse(coordinates);
    const newOrigin = coordinateArray[0];
    for (const coord of coordinateArray.slice(1, -1)) {
      let newCoord: number[] = [];
      newCoord[0] = coord[0] - newOrigin[0];
      newCoord[1] = coord[1] - newOrigin[1];
      angles[i++] = Math.atan2(newCoord[0], newCoord[1]); //This fails when crossing 0° need to find a fix
    }
    for (i = 1; i < angles.length; i++) {
      if (angles[i] < angles[i - 1]) count++;
      else count--;
    }
    return count > 0;
  }

  async uploadResource(documentId: number, files: Express.Multer.File[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        const checkDocumentSql = "SELECT 1 FROM Document WHERE documentId = ?";
        const insertResourceSql = "INSERT INTO Resource (data) VALUES (?)";
        const insertDocResSql =
          "INSERT INTO DocumentResources (documentId, resourceId, fileType, fileName) VALUES (?, ?, ?, ?)";

        if (!files || files.length === 0) return reject(new Error("No file uploaded"));

        db.get(checkDocumentSql, [documentId], (err: Error | null, row: any) => {
          if (err) return reject(err);
          if (!row) return reject(new Error("Document not found"));

          const uploadPromises = files.map((file) => {
            return new Promise<any>((res, rej) => {
              db.run(insertResourceSql, [file.buffer], function (err: Error | null) {
                if (err) return rej(err);
                const resourceId = this.lastID;
                db.run(
                  insertDocResSql,
                  [documentId, resourceId, file.mimetype, file.originalname],
                  (err: Error | null) => {
                    if (err) return rej(err);
                    res({
                      resourceId: resourceId,
                      fileName: file.originalname,
                      fileType: file.mimetype,
                      message: "Resource uploaded successfully",
                    });
                  }
                );
              });
            });
          });

          Promise.all(uploadPromises)
            .then((results) =>
              resolve({
                status: 201,
                resources: results,
                message: "All resources uploaded successfully",
              })
            )
            .catch((error) => reject(error));
        });
      } catch (error) {
        console.error("Unexpected error in uploadResource:", error);
        reject(error);
      }
    });
  }

  async getResourceById(resourceId: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const sql = `
        SELECT DocumentResources.fileName, DocumentResources.fileType, Resource.data
        FROM Resource
        JOIN DocumentResources ON Resource.resourceId = DocumentResources.resourceId
        WHERE Resource.resourceId = ?
      `;
      db.get(sql, [resourceId], (err: Error | null, row: any) => {
        if (err) return reject(err);
        if (row) resolve(row);
        else reject(new Error("Resource not found"));
      });
    });
  }

  async getResourcesByDocumentId(documentId: number): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `
        SELECT Resource.resourceId, DocumentResources.fileType, DocumentResources.fileName, Resource.data
        FROM Resource
        JOIN DocumentResources ON Resource.resourceId = DocumentResources.resourceId
        WHERE DocumentResources.documentId = ?
      `;
      db.all(sql, [documentId], (err: Error | null, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getFilteredDocuments(filters: {
    title?: string;
    description?: string;
    documentType?: string;
    nodeType?: string;
    stakeholders?: string[];
    issuanceDateStart?: string;
    issuanceDateEnd?: string;
    language?: string[];
  }): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let sql = `
        SELECT 
          D.documentId,
          D.title,
          D.description,
          DT.documentTypeName,
          D.scale,
          NT.nodeTypeName,
          D.issuanceDate,
          D.language,
          D.pages,
          G.georeferenceId,
          G.coordinates,
          G.georeferenceName,
          G.isArea,
          GROUP_CONCAT(S.stakeholderName) AS stakeholders
        FROM Document D
        JOIN DocumentType DT ON D.documentTypeId = DT.documentTypeId
        JOIN NodeType NT ON D.nodeTypeId = NT.nodeTypeId
        LEFT JOIN Georeference G ON D.georeferenceId = G.georeferenceId
        LEFT JOIN DocumentStakeholders DS ON D.documentId = DS.documentId
        LEFT JOIN Stakeholder S ON DS.stakeholderId = S.stakeholderId
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      // Filter: Title
      if (filters.title) {
        conditions.push(`D.title LIKE ?`);
        params.push(`%${filters.title}%`);
      }

      // Filter: Description
      if (filters.description) {
        conditions.push(`D.description LIKE ?`);
        params.push(`%${filters.description}%`);
      }

      // Filter: Document Type
      if (filters.documentType) {
        conditions.push(`DT.documentTypeName = ?`);
        params.push(filters.documentType);
      }

      // Filter: Node Type
      if (filters.nodeType) {
        conditions.push(`NT.nodeTypeName = ?`);
        params.push(filters.nodeType);
      }

      // Filter: Language
      if (filters.language && filters.language.length > 0) {
        const placeholders = filters.language.map(() => "?").join(",");
        conditions.push(`D.language IN (${placeholders})`);
        params.push(...filters.language);
      }

      // Filter: Issuance Date Range
      if (filters.issuanceDateStart && filters.issuanceDateEnd) {
        conditions.push(`D.issuanceDate BETWEEN ? AND ?`);
        params.push(filters.issuanceDateStart, filters.issuanceDateEnd);
      } else if (filters.issuanceDateStart) {
        conditions.push(`D.issuanceDate >= ?`);
        params.push(filters.issuanceDateStart);
      } else if (filters.issuanceDateEnd) {
        conditions.push(`D.issuanceDate <= ?`);
        params.push(filters.issuanceDateEnd);
      }

      // Apply conditions
      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(" AND ");
      }

      sql += ` GROUP BY D.documentId `;

      // Filter: Stakeholders
      if (filters.stakeholders && filters.stakeholders.length > 0) {
        // Ensure the document has all specified stakeholders
        const stakeholderCount = filters.stakeholders.length;
        sql += `
          HAVING COUNT(DISTINCT CASE WHEN S.stakeholderName IN (${filters.stakeholders
            .map(() => "?")
            .join(",")}) THEN S.stakeholderName END) = ?
        `;
        params.push(...filters.stakeholders, stakeholderCount);
      }

      db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }

        const documents = rows.map((row) => ({
          documentId: row.documentId,
          title: row.title,
          description: row.description,
          documentType: row.documentTypeName,
          scale: row.scale,
          nodeType: row.nodeTypeName,
          issuanceDate: row.issuanceDate,
          language: row.language,
          pages: row.pages,
          georeference: row.georeferenceId
            ? {
                georeferenceId: row.georeferenceId,
                coordinates: JSON.parse(row.coordinates),
                georeferenceName: row.georeferenceName,
                isArea: !!row.isArea,
              }
            : null,
          stakeholders: row.stakeholders
            ? JSON.stringify(row.stakeholders.split(",").map((stake: string) => stake.trim()))
            : "[]",
        }));

        resolve(documents);
      });
    });
  }

  async getConnections(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        const sql = `SELECT documentId1, documentId2, connection FROM DocumentConnections`;
        db.all(sql, (err: Error | null, rows: any) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getConnectionsById(documentId: number): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `
        SELECT *
        FROM DocumentConnections
        WHERE documentId1 = ? OR documentId2 = ?
      `;
      db.all(sql, [documentId, documentId], (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async getGeoreferences(isArea?: boolean): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let sql = `SELECT georeferenceId, coordinates, georeferenceName, isArea, areaColor FROM Georeference`;

      if (isArea === undefined) {
        try {
          db.all(sql, (err: Error | null, rows: any) => {
            if (err) return reject(err);
            resolve(rows);
          });
        } catch (error) {
          reject(error);
        }
      } else {
        sql += ` WHERE isArea = ?`;
        db.all(sql, [isArea ? 1 : 0], (err: Error | null, rows: any[]) => {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        });
      }
    });
  }

  async createDocumentWithExistingGeoreference(
    title: string,
    description: string,
    documentType: string,
    scale: string,
    nodeType: string,
    stakeholders: string[],
    issuanceDate: string | null,
    language: string | null,
    pages: string | null,
    georeferenceId: number | null
  ): Promise<any> {
    try {
      const documentTypeId = await this.getDocumentTypeId(documentType);
      const nodeTypeId = await this.getNodeTypeId(nodeType);

      return new Promise<any>((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION", (err: Error | null) => {
            if (err) {
              return reject(err);
            }

            // Verify GeoreferenceId
            if (georeferenceId !== null) {
              const verifyGeoSql = `SELECT georeferenceId FROM Georeference WHERE georeferenceId = ?`;
              db.get(verifyGeoSql, [georeferenceId], (err: Error | null, geoRow: any) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                if (!geoRow) {
                  db.run("ROLLBACK");
                  return reject(new Error("Invalid georeferenceId"));
                }
                proceedWithInsert();
              });
            } else {
              proceedWithInsert();
            }

            function proceedWithInsert() {
              // Insert Document
              const documentIdSql = `SELECT MAX(documentId) AS documentId FROM Document`;
              const insertDocumentSql = `
                  INSERT INTO Document 
                  (documentId, title, description, documentTypeId, scale, nodeTypeId, issuanceDate, language, pages, georeferenceId)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
              db.get(documentIdSql, (err: Error | null, row: any) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                const documentId = row.documentId ? row.documentId + 1 : 1;
                db.run(
                  insertDocumentSql,
                  [
                    documentId,
                    title,
                    description,
                    documentTypeId,
                    scale,
                    nodeTypeId,
                    issuanceDate,
                    language,
                    pages,
                    georeferenceId,
                  ],
                  function (err: Error | null) {
                    if (err) {
                      db.run("ROLLBACK");
                      return reject(err);
                    }

                    // Insert into DocumentStakeholders
                    insertStakeholders(documentId, 0);
                  }
                );
              });
            }

            function insertStakeholders(documentId: number, index: number) {
              if (index >= stakeholders.length) {
                // All stakeholders inserted, commit transaction
                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }
                  resolve({ documentId });
                });
                return;
              }

              const stakeholderName = stakeholders[index];
              const getStakeholderId = `SELECT stakeholderId FROM Stakeholder WHERE stakeholderName = ?`;
              db.get(getStakeholderId, [stakeholderName], (err, stakeholderRow: any) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                if (!stakeholderRow) {
                  db.run("ROLLBACK");
                  return reject(new Error(`Invalid stakeholder: ${stakeholderName}`));
                }
                const stakeholderId = stakeholderRow.stakeholderId;
                const insertDocStakeSql = `INSERT INTO DocumentStakeholders (documentId, stakeholderId) VALUES (?, ?)`;
                db.run(insertDocStakeSql, [documentId, stakeholderId], (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }
                  // Insert next stakeholder
                  insertStakeholders(documentId, index + 1);
                });
              });
            }
          });
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async updateGeoreferenceId(documentId: number, georeferenceId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const sql = `UPDATE Document SET georeferenceId = ? WHERE documentId = ?`;
      db.run(sql, [georeferenceId, documentId], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async createDocumentType(documentType: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const insertSql = `INSERT INTO DocumentType (documentTypeName) VALUES (?)`;

      db.run(insertSql, [documentType], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async getDocumentTypes(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `SELECT documentTypeId, documentTypeName FROM DocumentType`;

      db.all(sql, (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async createNodeType(nodeType: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const insertSql = `INSERT INTO NodeType (nodeTypeName) VALUES (?)`;

      db.run(insertSql, [nodeType], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async getNodeTypes(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `SELECT nodeTypeId, nodeTypeName FROM NodeType`;

      db.all(sql, (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  async createStakeholder(stakeholder: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const insertSql = `INSERT INTO Stakeholder (stakeholderName) VALUES (?)`;

      db.run(insertSql, [stakeholder], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  async getStakeholders(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const sql = `SELECT stakeholderId, stakeholderName FROM Stakeholder`;

      db.all(sql, (err: Error | null, rows: any[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
}

export default DocumentDAO;
