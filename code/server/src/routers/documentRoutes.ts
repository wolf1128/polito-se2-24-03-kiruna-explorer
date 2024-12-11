import express, { Router } from "express";
import DocumentController from "../controllers/documentController";
import { body, param, query } from "express-validator";
import ErrorHandler from "../helper";
import Authenticator from "./auth";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

class DocumentRoutes {
  private router: Router;
  private errorHandler: ErrorHandler;
  private controller: DocumentController;
  private authenticator: Authenticator;

  constructor(authenticator: Authenticator) {
    this.router = express.Router();
    this.errorHandler = new ErrorHandler();
    this.controller = new DocumentController();
    this.authenticator = authenticator;
    this.initRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  initRoutes() {
    this.router.post(
      "/",
      this.authenticator.isLoggedIn,
      body("title").notEmpty().isString(),
      body("description").notEmpty().isString(),
      body("documentType").notEmpty().isString(),
      body("scale").notEmpty().isString(),
      body("nodeType").notEmpty().isString(),
      body("stakeholders").notEmpty().isArray(),
      body("issuanceDate").optional().isString(),
      body("language").optional().isString(),
      body("pages").optional().isString(),
      body("georeference").optional({ nullable: true }).isArray(),
      body("georeferenceName").optional().isString(),
      body("areaColor").optional().isString(),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .createDocument(
            req.body.title,
            req.body.description,
            req.body.documentType,
            req.body.scale,
            req.body.nodeType,
            req.body.stakeholders,
            req.body.issuanceDate,
            req.body.language,
            req.body.pages,
            req.body.georeference,
            req.body.georeferenceName,
            req.body.areaColor
          )
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    /**
     * Route for linking documents.
     * It requires the user to be logged in.
     * It requires the following parameters:
     * - documentId1: number. It is the first document to be connected.
     * - documentId2: number. It is the second document to be connected.
     * - linkType: string. It must be one of the four known link types.
     * It returns a 201 status code if the link is registered successfully.
     */
    this.router.post(
      "/link",
      this.authenticator.isLoggedIn,
      body("documentId1")
        .isInt()
        .custom((value) => value > 0),
      body("documentId2")
        .isInt()
        .custom((value) => value > 0),
      body("linkType")
        .isString()
        .isIn(["direct consequence", "collateral consequence", "prevision", "update"]),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .linkDocuments(req.body.documentId1, req.body.documentId2, req.body.linkType)
          .then(() =>
            res.status(201).json({
              status: "success",
              message: "Documents linked successfully",
              data: {
                documentId1: req.body.documentId1,
                documentId2: req.body.documentId2,
                linkType: req.body.linkType,
              },
            })
          )
          .catch((err) => {
            res.status(err.customCode);
            next(err);
          })
    );

    this.router.get("/", (req: any, res: any, next: any) => {
      this.controller
        .getDocuments()
        .then((documents) => res.status(200).json(documents))
        .catch((err) => next(err));
    });

    /*
     * This route can be used to update any field of a document in the future, just by specifying in the body the field to update and its new value.
     * For now it will by default always assume the call is made to update the georeference.
     */
    this.router.patch(
      "/:documentId",
      this.authenticator.isLoggedIn,
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) => {
        this.controller
          .georeferenceDocument(req.params.documentId, req.body.georeference)
          .then(() =>
            res.status(201).json({
              status: "success",
              message: "Georeference created successfully",
              data: req.body.georeference,
            })
          )
          .catch((err) => {
            res.status(err.customCode);
            next(err);
          });
      }
    );

    this.router.post(
      "/:documentId/upload-resource",
      this.authenticator.isLoggedIn,
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      upload.array("files"),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .uploadResource(req.params.documentId, req.files)
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    this.router.get(
      "/resource/:resourceId",
      param("resourceId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .getResource(parseInt(req.params.resourceId, 10))
          .then((resource) => res.status(200).json(resource))
          .catch((error: any) => next(error))
    );

    this.router.get(
      "/:documentId/resources",
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .getResources(parseInt(req.params.documentId, 10))
          .then((resources) => res.status(200).json(resources))
          .catch((error: any) => next(error))
    );

    this.router.get(
      "/filtered",
      query("title").optional().isString(),
      query("description").optional().isString(),
      query("documentType").optional().isString(),
      query("nodeType").optional().isString(),
      query("stakeholders")
        .optional()
        .customSanitizer((value) => {
          if (Array.isArray(value)) {
            return value;
          }
          return [value];
        })
        .isArray(),
      query("issuanceDateStart")
        .optional()
        .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/),
      query("issuanceDateEnd")
        .optional()
        .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/),
      query("language")
        .optional()
        .customSanitizer((value) => {
          if (Array.isArray(value)) {
            return value;
          }
          return [value];
        })
        .isArray(),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) => {
        const filters = {
          title: req.query.title,
          description: req.query.description,
          documentType: req.query.documentType,
          nodeType: req.query.nodeType,
          stakeholders: req.query.stakeholders,
          issuanceDateStart: req.query.issuanceDateStart,
          issuanceDateEnd: req.query.issuanceDateEnd,
          language: req.query.language,
        };
        this.controller
          .getFilteredDocuments(filters)
          .then((documents) => res.status(200).json(documents))
          .catch((err) => next(err));
      }
    );

    this.router.get("/connections", (req: any, res: any, next: any) => {
      this.controller
        .getConnections()
        .then((connections) => res.status(200).json(connections))
        .catch((err) => next(err));
    });

    this.router.get(
      "/georeferences",
      query("isArea").optional().isBoolean().withMessage("isArea must be a boolean"),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) => {
        const isArea = req.query.isArea !== undefined ? req.query.isArea === "true" : undefined;
        this.controller
          .getGeoreferences(isArea)
          .then((georeferences) => res.status(200).json(georeferences))
          .catch((error: any) => next(error));
      }
    );

    this.router.get(
      "/:documentId/connections",
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .getConnectionsById(parseInt(req.params.documentId, 10))
          .then((connections) => res.status(200).json(connections))
          .catch((error: any) => next(error))
    );

    this.router.get(
      "/:documentId",
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) => {
        this.controller
          .getDocumentById(parseInt(req.params.documentId, 10))
          .then((document) => res.status(200).json(document))
          .catch((error: any) => next(error));
      }
    );

    this.router.post(
      "/with-existing-georeference",
      this.authenticator.isLoggedIn,
      body("title").notEmpty().isString(),
      body("description").notEmpty().isString(),
      body("documentType").notEmpty().isString(),
      body("scale").notEmpty().isString(),
      body("nodeType").notEmpty().isString(),
      body("stakeholders").notEmpty().isArray(),
      body("issuanceDate").optional().isString(),
      body("language").optional().isString(),
      body("pages").optional().isString(),
      body("georeferenceId")
        .optional({ nullable: true })
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .createDocumentWithExistingGeoreference(
            req.body.title,
            req.body.description,
            req.body.documentType,
            req.body.scale,
            req.body.nodeType,
            req.body.stakeholders,
            req.body.issuanceDate,
            req.body.language,
            req.body.pages,
            req.body.georeferenceId
          )
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    this.router.patch(
      "/:documentId/existing-georeference",
      this.authenticator.isLoggedIn,
      param("documentId")
        .isInt()
        .custom((value) => value > 0),
      body("georeferenceId")
        .isInt()
        .custom((value) => value > 0),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .updateGeoreferenceId(parseInt(req.params.documentId, 10), req.body.georeferenceId)
          .then(() => res.status(200).json({ message: "Georeference updated successfully" }))
          .catch((error: any) => next(error))
    );

    this.router.post(
      "/types/document-types",
      this.authenticator.isLoggedIn,
      body("documentType").notEmpty().isString(),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .createDocumentType(req.body.documentType)
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    this.router.get("/types/document-types", (req: any, res: any, next: any) =>
      this.controller
        .getDocumentTypes()
        .then((documentTypes) => res.status(200).json(documentTypes))
        .catch((error: any) => next(error))
    );

    this.router.post(
      "/types/node-types",
      this.authenticator.isLoggedIn,
      body("nodeType").notEmpty().isString(),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .createNodeType(req.body.nodeType)
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    this.router.get("/types/node-types", (req: any, res: any, next: any) =>
      this.controller
        .getNodeTypes()
        .then((nodeTypes) => res.status(200).json(nodeTypes))
        .catch((error: any) => next(error))
    );

    this.router.post(
      "/types/stakeholders",
      this.authenticator.isLoggedIn,
      body("stakeholder").notEmpty().isString(),
      this.errorHandler.validateRequest,
      (req: any, res: any, next: any) =>
        this.controller
          .createStakeholder(req.body.stakeholder)
          .then((data: any) => res.status(201).json(data))
          .catch((error: any) => next(error))
    );

    this.router.get("/types/stakeholders", (req: any, res: any, next: any) =>
      this.controller
        .getStakeholders()
        .then((stakeholders) => res.status(200).json(stakeholders))
        .catch((error: any) => next(error))
    );
  }
}

export default DocumentRoutes;
