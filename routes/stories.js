const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ensureAuth } = require('../middleware/auth');

const Story = require('../Models/Story');
const Comment = require('../Models/Comment');

// Make a storage object with destination and filename 
const storage = multer.diskStorage({
    destination: function(req, res, callback) {
        callback(null, path.join(__dirname, '../public/img'));
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
})

const upload = multer({storage});

// @desc  Show add page
// @route Get /stories/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('stories/add');
});

// @desc  Process add form
// @route POST /stories
router.post('/', ensureAuth, upload.single('story-image') , async (req, res) => {
    try {
        req.body.user = req.user.id;
        let pathImage = req.file ? req.file.path : 'img/default-story-image.png';

         await Story.create({
             title: req.body.title,
             body: req.body.body,
             status: req.body.status,
             user: req.body.user,
             image: pathImage
         });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc  Show all stories
// @route Get /stories
router.get('/', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({ status: 'public' })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean()
        
            res.render('stories/index', {
                stories
            })
    } catch (err) {
        console.error(err);
        res.render('error/500')
    }
});

// @desc  Show single story
// @route Get /stories/show/:id
router.get('/show/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id)
        .populate('user')
        .lean();

        const comments = await Comment.find({ storyId: req.params.id })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean();

    if (!story) {
        return res.render('error/404');
    }

    res.render('stories/show', {
        story,
        comments
    })
    } catch(err) {
        console.error(err);
        res.render('error/404');
    }
});

// @desc  Process add commentary
// @route POST /stories/show/:id
router.post('/show/:id', ensureAuth, async (req, res) => {
    try {
        if (!req.body.body){
            res.render('stories/show', {
                story,
                comments
            });
        }

        req.body.storyId = req.params.id;
        req.body.user = req.user.id;
        await Comment.create(req.body);

        const comments = await Comment.find({ storyId: req.params.id })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean();

        let story = await Story.findById(req.params.id)
            .populate('user')
            .lean();

        res.render('stories/show', {
            story,
            comments
        });

    } catch(err) {
        console.error(err);
        res.render('error/404');
    }
});

// @desc  Delete commentary
// @route DELETE /stories/show/:id
router.delete('/show/:id', ensureAuth, async (req, res) => {
    try {
        let commentToDelete = await Comment.findById({ _id: req.params.id });
        let storyId = commentToDelete.storyId;

        await Comment.deleteOne( { _id: req.params.id });

        const comments = await Comment.find({ storyId: storyId })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean();

        let story = await Story.findById(storyId)
            .populate('user')
            .lean();

        res.render('stories/show', {
            story,
            comments
        });

    } catch(err) {
        console.error(err);
        res.render('error/505');
    }
});

// @desc  Show edit page
// @route Get /stories/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const story = await Story.findOne({
            _id: req.params.id
        }).lean();
    
        if (!story) {
            return res.render('error/404');
        }
    
        if (story.user != req.user.id) {
            res.redirect('/stories');
        } else {
            res.render('stories/edit', {
                story,
            })
        }
    } catch (err) {
        console.error(err);
        return res.render('error/505');
    }
});

// @desc  Update story
// @route Put /stories/:id
router.put('/:id', ensureAuth, upload.single('story-image'), async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean();

    if (!story) {
        return res.render('error/404');
    }

    if (story.user != req.user.id) {
        res.redirect('/stories');
    } else {
        let isDifferentImageAndExists = req.file && req.file.path !== story.image

        if (isDifferentImageAndExists) {
            fs.unlink(story.image, (err) => {
                if (err) console.error(err);
            })
        }

        let image_path = isDifferentImageAndExists ? req.file.path : story.image;
        
        story = await Story.findOneAndUpdate( { _id: req.params.id }, 
            {
                title: req.body.title,
                body: req.body.body,
                status: req.body.status,
                user: req.body.user,
                image: image_path || 'img/default-story-image.png'
            }, 
        {
            new: true,
            runValidators: true
        })

        res.redirect('/dashboard');
    }
    } catch (err) {
        console.error(err);
        return res.render('error/505');
    }
});

// @desc  Delete story
// @route DELETE /stories/:id
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        await Comment.remove({ storyId: req.params.id });
        await Story.remove({ _id: req.params.id });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        return res.render('error/505');
    }
});

// @desc  User stories
// @route Get /stories/user/:userId
router.get('/user/:userId', ensureAuth, async (req, res) => {
    try {
        let path = { userUrl : true };
        const stories = await Story.find( {
            user: req.params.userId,
            status: 'public'
        })
        .populate('user')
        .lean();
        res.render('stories/index', {
            stories,
            path
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

module.exports = router;