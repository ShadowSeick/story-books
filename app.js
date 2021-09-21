const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

//Load config file
dotenv.config({ path: './config/config.env'});

// Passport config
require('./config/passport')(passport);

connectDB();

const app = express();

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));



//Logging
if (process.env.Node_ENV === 'development') {
    app.use(morgan('dev'));
}

//Handlebars Helpers
const { formatDate, truncate, stripTags, editIcon, deleteCommentIcon, select, stripDownPublicFolderPath} = require('./helpers/hbs');

//Handlebars
app.engine('.hbs', exphbs({ 
    helpers: {
        formatDate,
        truncate,
        stripTags,
        editIcon,
        deleteCommentIcon,
        select,
        stripDownPublicFolderPath
    }, 
    defaultLayout: 'main', 
    extname: '.hbs' }));
app.set('view engine', '.hbs');

// Sessions
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        mongooseConnection: mongoose.connection,
        ttl: 2 * 24 * 60 * 60 // save session for 2 days
    })
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set global var
app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    next();
})

// Static folder
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`));