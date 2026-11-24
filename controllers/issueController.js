
const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createIsuue (req,res) {
    const {title, description} = req.body;
    const {id} = req.params;

    try{
    const issue= new Issue ({
        title,
        description,
        repository: id,
   });
   await issue.save()
   res.status(201).json(issue)
} catch (err) {
    console.error("Error during issue creation : ", err.message);
    res.status(500).send("Server error!");
}
}

async function updateIsuueById (req,res) {
   const {id}= req.params;
   const {title, description, status} = req.body;

   try {
     const issue = await Issue.findById(id);

     if(!issue) {
        return res.status(404).json({error: "issue not found"})
   }

    issue.title = title;
    issue.description = description;
    issue.status = status;

    await issue.save()
    res.json(issue)

   }catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error!");
}
}

async function deleteIsuueById(req,res) {
    const {id} = req.params;

    try {  
        const issue = await Issue.findByIdAndDelete(id);

        if(!issue) {
            return res.status(404).json({error: "issue not found"});
        }

        res.json({message: "Issue deleted successfully"});

    } catch(err) {
        console.error("Error during issue deletion : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function getAllIssues(req,res) {
    const {id} = req.params;

    try {
        const issues = await Issue.find({repository: id});

        if(issues.length === 0) {
            return res.status(404).json({error: "issue not found"});
        }

        res.json(issues);

    } catch(err) {
        console.error("Error fetching issues : ", err.message);
        res.status(500).send("Server error!");
    }
}

async function getIssueById(req,res) {
    const {id} = req.params;

    try {
        const issue = await Issue.findById(id);

        if(!issue) {
            return res.status(404).json({error: "issue not found"});
        }

        res.json(issue);

    } catch(err) {
        console.error("Error fetching issue : ", err.message);
        res.status(500).send("Server error!");
    }
}

module.exports = {
   createIsuue,
   updateIsuueById,
   deleteIsuueById,
   getAllIssues,
   getIssueById
}

