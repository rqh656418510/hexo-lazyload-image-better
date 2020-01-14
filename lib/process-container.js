'use strict';

const fs = require("fs");
const hexoFs = require('hexo-fs');
const Promise = require('bluebird');
const imageSize = require('image-size');
const streamToArray = require('stream-to-array');
const imageToGradientSync = require('image-to-gradient');

const defaultImagePath = __dirname + '/default-image.json';
const imageToGradient = Promise.promisify(imageToGradientSync);
const log = require('hexo-log')({name: 'hexo-lazyload-image-better', debug: false});

const gradientOptions = {
    angle: 0,  // gradient angle in degrees
    steps: 10  // number of steps
}

const relativePathMatch = /\.\.?\//g;
const globalImageMatch = /<img(\s[^>]*?)src\s*=\s*['\"]([^'\"]*?)['\"]([^>]*?)>/gi;
const localImageMatch = /<img(\s[^>]*?)src\s*=\s*['\"]([^'\"]*?)['\"]([^>]*?)>/i;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getImageMatch(path) {
    return new RegExp("<img(\\s[^>]*?)src\\s*=\\s*['\"](" + escapeRegExp(path) + ")['\"]([^>]*?)>", 'i');
}

function getImagePath(url){
    if(url.startsWith("/")){
        return "source" + url;
    }
    return "source/" + url.replace(relativePathMatch, "");
}

function lazyProcessContainer(htmlContent) {
    const hexo = this;
    const config = hexo.config.lazyload;
    const loadingImage = config.loadingImg;

    if (!loadingImage) {
        loadingImage = JSON.parse(hexoFs.readFileSync(defaultImagePath)).default;
    }

    var matches = htmlContent.match(globalImageMatch);
    if (!matches) {
        return;
    }

    // get images width and height
    var promises = matches.map(function (match) {
        var match = match.match(localImageMatch);
        if (!match) {
            return;
        }

        var item = { url: match[2], path: getImagePath(match[2])};
        var imageStream = fs.createReadStream(item.path);

        return streamToArray(imageStream).then(function (imageArray) {
            // TODO store with map
            var imageBuffer = Buffer.concat(imageArray);
            var size = imageSize(imageBuffer);

            item.width = size.width;
            item.height = size.height;
            log.info("images ==> url: " + item.url + ", path: " + item.path + ", width: " + item.width + ", height: " + item.height);

            return imageToGradient(imageBuffer, gradientOptions).then(function (gradient) {
                item.gradient = gradient;
                return item;
            }, function (error) {
                log.error('Failed to create gradient', error);
            });
        }, function (error) {
            log.error('Failed to stream array', error);
        });
    });

    // replace html content
    return Promise.all(promises).then(function (items) {
        items.forEach(function (item) {
            var regex = getImageMatch(item.url);
            htmlContent = htmlContent.replace(regex, function (tag, pre, url, post) {
                // might be duplicate
                if(/data-original/gi.test(tag)){
                    return tag;
                }
                if(/src="data:image(.*?)/gi.test(tag)) {
                    return tag;
                }
                if(/no-lazy/gi.test(tag)) {
                    return tag;
                }

                // TODO add loading image
                var result = '<div class="img-container" style="width:' + item.width + 'px;background:' + item.gradient + '">' +
                                '<img' + pre + 'data-src="' + url + '"' + post +
                                    ' height="' + item.height + '" width="' + item.width + '" style="padding-top:' + (item.height / item.width * 100) + '%">' +
                             '</div>';

                return result;
            });
        });

        return htmlContent;
    });
}

module.exports.processSite = function (htmlContent) {
    lazyProcessContainer.call(this, htmlContent);
};
