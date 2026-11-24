
const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        error: "Repository name is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({
        error: "Invalid User Id"
      });
    }

    const user = await User.findById(owner);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (issues && !issues.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        error: "Invalid Issue Id"
      });
    }

    const existingRepository = await Repository.findOne({ name });

    if (existingRepository) {
      return res.status(400).json({
        error: "Repository name already exists"
      });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner: user._id,
      content: content || [],
      issues: issues || [],
    });

    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository created",
      repositoryID: result._id,
    });

  } catch (err) {
    console.error("Error during repository creation:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res.json(repositories);

  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid Repository Id"
      });
    }

    const repository = await Repository.findById(id)
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!"
      });
    }

    res.json(repository);

  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;

  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);

  } catch (err) {
    console.error("Error during repository fetching:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid User Id"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const repositories = await Repository.find({
      owner: user._id
    })
      .populate("owner")
      .populate("issues");

    res.status(200).json({
      message: "Repositories fetched successfully",
      repositories
    });

  } catch (err) {
    console.error("Error during repositories fetching:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

// Add Star to Repository
async function addStar(req, res) {
  const { userId, repoId } = req.params;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(repoId)
    ) {
      return res.status(400).json({
        error: "Invalid User Id or Repository Id"
      });
    }

    const user = await User.findById(userId);
    const repository = await Repository.findById(repoId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found"
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        StarRepos: repoId
      }
    });

    res.status(200).json({
      message: "Repository starred successfully!"
    });

  } catch (err) {
    console.error("Error during starring repository:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

// Remove Star from Repository
async function removeStar(req, res) {
  const { userId, repoId } = req.params;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(repoId)
    ) {
      return res.status(400).json({
        error: "Invalid User Id or Repository Id"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: {
        StarRepos: repoId
      }
    });

    res.status(200).json({
      message: "Star removed successfully!"
    });

  } catch (err) {
    console.error("Error during removing star:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

// Get Starred Repositories
async function getStarredRepositories(req, res) {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid User Id"
      });
    }

    const user = await User.findById(userId).populate({
      path: "StarRepos",
      populate: [
        { path: "owner" },
        { path: "issues" }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.status(200).json({
      message: "Starred repositories fetched successfully",
      repositories: user.StarRepos
    });

  } catch (err) {
    console.error("Error during starred repositories fetching:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!"
      });
    }

    if (content) {
      repository.content.push(content);
    }

    if (description) {
      repository.description = description;
    }

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });

  } catch (err) {
    console.error("Error during updating repository:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!"
      });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });

  } catch (err) {
    console.error("Error during toggling visibility:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

// Delete Repository By ID
async function deleteRepositoryById(req, res) {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid Repository Id"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid User Id"
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!"
      });
    }

    // Check Repository Owner
    if (repository.owner.toString() !== userId) {
      return res.status(403).json({
        error: "You cannot delete another user's repository"
      });
    }

    // Delete Repository
    await Repository.findByIdAndDelete(id);

    // Remove Repository ID From User
    await User.findByIdAndUpdate(userId, {
      $pull: {
        repositories: id,
        StarRepos: id
      }
    });

    res.status(200).json({
      message: "Repository deleted successfully"
    });

  } catch (err) {
    console.error("Error during deleting repository:", err.message);
    res.status(500).json({
      error: "Server error!"
    });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  addStar,
  removeStar,
  getStarredRepositories,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};




