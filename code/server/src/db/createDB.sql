-- database: db.db
DROP TABLE IF EXISTS Document;
DROP TABLE IF EXISTS Georeference;
DROP TABLE IF EXISTS DocumentConnections;
DROP TABLE IF EXISTS Resource;
DROP TABLE IF EXISTS DocumentResources;
DROP TABLE IF EXISTS Attachment;
DROP TABLE IF EXISTS DocumentAttachments;
DROP TABLE IF EXISTS DocumentType;
DROP TABLE IF EXISTS NodeType;
DROP TABLE IF EXISTS Stakeholder;
DROP TABLE IF EXISTS DocumentStakeholders;

CREATE TABLE Document (
    documentId INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    documentTypeId INTEGER NOT NULL,
    scale TEXT NOT NULL,
    nodeTypeId INTEGER NOT NULL,
    issuanceDate TEXT DEFAULT NULL,
    language TEXT DEFAULT NULL,
	pages TEXT DEFAULT NULL,
	georeferenceId INTEGER DEFAULT NULL
);

CREATE TABLE Georeference (
	georeferenceId INTEGER PRIMARY KEY,
	coordinates TEXT NOT NULL,
	georeferenceName TEXT NOT NULL,
	isArea BOOLEAN NOT NULL,
  areaColor TEXT
);

CREATE TABLE DocumentConnections (
	documentId1 INTEGER,
	documentId2 INTEGER,
	connection TEXT NOT NULL,
	PRIMARY KEY (documentId1, documentId2, connection)
);

CREATE TABLE Resource (
	resourceId INTEGER PRIMARY KEY AUTOINCREMENT,
	data LONGBLOB
);

CREATE TABLE DocumentResources (
	resourceId INTEGER PRIMARY KEY,
	documentId INTEGER,
	fileType TEXT NOT NULL,
	fileName TEXT NOT NULL
);

CREATE TABLE Attachment (
	attachmentId INTEGER PRIMARY KEY AUTOINCREMENT,
	data LONGBLOB
);

CREATE TABLE DocumentAttachments (
	attachmentId INTEGER PRIMARY KEY,
	documentId INTEGER,
	fileType TEXT NOT NULL,
	fileName TEXT NOT NULL
);

CREATE TABLE DocumentType (
	documentTypeId INTEGER PRIMARY KEY AUTOINCREMENT,
	documentTypeName TEXT NOT NULL UNIQUE
);

CREATE TABLE NodeType (
	nodeTypeId INTEGER PRIMARY KEY AUTOINCREMENT,
	nodeTypeName TEXT NOT NULL UNIQUE
);

CREATE TABLE Stakeholder (
	stakeholderId INTEGER PRIMARY KEY AUTOINCREMENT,
	stakeholderName TEXT NOT NULL UNIQUE
);

CREATE TABLE DocumentStakeholders (
	documentId INTEGER,
	stakeholderId INTEGER,
	PRIMARY KEY (documentId, stakeholderId)
);
