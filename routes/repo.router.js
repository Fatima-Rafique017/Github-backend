
const express = require("express");
const repoController = require("../controllers/repoController");

const repoRouter = express.Router();

// Specific routes pehle
repoRouter.post("/repo/create", repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/user/:userId", repoController.fetchRepositoriesForCurrentUser);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);

// Star Repository Routes
repoRouter.post("/repo/star/:userId/:repoId", repoController.addStar);
repoRouter.delete("/repo/unstar/:userId/:repoId", repoController.removeStar);
repoRouter.get("/repo/starred/:userId", repoController.getStarredRepositories);

repoRouter.put("/repo/update/:id", repoController.updateRepositoryById);
repoRouter.patch("/repo/toggle/:id", repoController.toggleVisibilityById);
repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);

// Generic :id route sab se aakhir mein
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);

module.exports = repoRouter;
