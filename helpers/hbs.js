const moment = require('moment');

module.exports = {
    formatDate: function (date, format) {
        return moment(date).format(format);
    },
    truncate: function (str, len) {
        if (str.length > len && str.length > 0) {
            let new_str = str + ' ';
            new_str = str.substr(0, len);
            new_str = str.substr(0, new_str.lastIndexOf(' '));
            new_str = new_str.length > 0 ? new_str : str.substr(0, len);
            return new_str + '...'; 
        }
        return str;
    },
    stripTags: function (input) {
        return input.replace(/<(?:.|\n)*?>/gm, '');
    },
    editIcon: function (storyUser, loggedUser, storyId, floating = true) {
        if (storyUser._id.toString() == loggedUser._id.toString()) {
            if (floating) {
                return `<a href="/stories/edit/${storyId}" class="btn-floating left halfway-fab blue z-depth-2"><i class="fas fa-edit fa-small"></i></a>`
            } else {
                return `<a href="/stories/edit/${storyId}"><i class="fas fa-edit fa-small"></i></a>`
            }
        }
    },
    deleteCommentIcon: function (commentUser, loggedUser, commentId) {
        if (commentUser._id.toString() == loggedUser._id.toString()) {
            return `<form action="/stories/show/${commentId}?_method=DELETE" method="POST" class="right" id="delete-form">
            <button type="submit" class="btn red"><i class="fas fa-trash fa-small"></i></button></form>`;
        } else {
            return ``;
        }
    },
    select: function (selected, options) {
        return options
            .fn(this)
            .replace(
                new RegExp(' value="' + selected + '"'),
                '$& selected="selected"'
            )
            .replace(
                new RegExp('>' + selected + '</option>'),
                ' selected="selected"$&'
            )
    },
    stripDownPublicFolderPath: function (path) {
        path = path.split("/");
        return path[path.length - 1];
    }
}