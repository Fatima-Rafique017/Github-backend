const express = require("express");
const issueController = require("../controllers/issueController");

const issueRouter = express.Router();

issueRouter.post("/issue/create", issueController. createIsuue);
issueRouter.put("/issue/update/:id", issueController. updateIsuueById,);
issueRouter.delete("/issue/delete/:id", issueController.deleteIsuueById);
issueRouter.get("/issue/all", issueController.getAllIssues);
issueRouter.get("/issue/:id", issueController.getIssueById);

module.exports = issueRouter;
