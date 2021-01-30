'use strict';

const hexoFs = require('hexo-fs');
const HashMap = require('hashmap');
const imageSize = require('image-size');

const imageMap = new HashMap();
const defaultImagePath = __dirname + '/default-image.json';
const log = require('hexo-log')({name: 'hexo-lazyload-image-better', debug: false});

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

function lazyProcess(htmlContent) {
    const config = this.config.lazyload;
    var loadingImage = config.loadingImg;

    if (!loadingImage) {
        loadingImage = JSON.parse(hexoFs.readFileSync(defaultImagePath)).default;
    }

    return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function (str, p1, p2) {
        // might be duplicate
        if(/data-original/gi.test(str)){
            return str;
        }
        if(/src="data:image(.*?)/gi.test(str)) {
            return str;
        }
        if(/no-lazy/gi.test(str)) {
            return str;
        }
        return str.replace(p2, loadingImage + '" data-original="' + p2);
    });
}

function lazyProcessContainer(htmlContent) {
    const config = this.config.lazyload;
    var loadingImage = config.loadingImg;

    if (!loadingImage) {
        loadingImage = JSON.parse(hexoFs.readFileSync(defaultImagePath)).default;
    }

    var matches = htmlContent.match(globalImageMatch);
    if (!matches) {
        return htmlContent;
    }

    var images = [];

    // handle image url, width, height
    matches.map(function (match) {
        var match = match.match(localImageMatch);
        if (!match) {
            return htmlContent;
        }

        var item = {};
        var cache = imageMap.get(match[2])
        if(cache){
            item = cache;
        }
        else{
            item = {url: match[2], path: getImagePath(match[2])};
            var size = imageSize(item.path);
            item.width = size.width;
            item.height = size.height;
            imageMap.set(item.url, item);
        }

        images.push(item);
        // log.info("image ==> url: " + item.url + ", path: " + item.path + ", width: " + item.width + ", height: " + item.height);
    });

    // add image container and loading image
    images.forEach(function (image) {
        var regex = getImageMatch(image.url);
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

            // new html code
            var result = '<div class="img-lazyload-container" style="width:' + image.width + 'px;background:url(' + loadingImage + ');background-repeat:no-repeat;background-position:center;">' +
                            '<img data-original="' + url + '"' +
                                ' height="' + image.height + '" width="' + image.width + '" style="padding-top:' + (image.height / image.width * 100) + '%">' +
                         '</div>';

            return result;
        });
    });

    return htmlContent;
}

module.exports.processPost = function (data) {
    if(this.config.lazyload.post.excludeEncrypt && this.config.encrypt && this.config.encrypt.enable && (data.password && data.password != "")){
        return data;
    }

    if(!this.config.lazyload.imgContainer){
        data.content = lazyProcess.call(this, data.content);
    }
    else{
        data.content = lazyProcessContainer.call(this, data.content);
    }
    return data;
};

module.exports.processSite = function (htmlContent) {
    if(!this.config.lazyload.imgContainer){
        return lazyProcess.call(this, htmlContent);
    }
    return lazyProcessContainer.call(this, htmlContent);
};
