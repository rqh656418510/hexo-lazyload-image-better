'use strict';

if (!hexo.config.lazyload || !hexo.config.lazyload.enable) {
    return;
}

if (hexo.config.lazyload.post && hexo.config.lazyload.post.only) {
    hexo.extend.filter.register('after_post_render', require('./lib/process').processPost);
}
else {
    hexo.extend.filter.register('after_render:html', require('./lib/process').processSite);
}

hexo.extend.filter.register('after_render:html', require('./lib/addstyle').addStyle);
hexo.extend.filter.register('after_render:html', require('./lib/addscripts').addScript);
