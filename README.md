# hexo-lazyload-image-better

A hexo plugin which is used to have all images support lazyload automatically. With the help of this functionality, it will improve lots of the loading proformance, base on [hexo-lazyload-image](https://github.com/Troy-Yang/hexo-lazyload-image) .

## Changed

1. Fix bugs that sometime fail to load images.
2. The detection is made by IntersectionObserver if supported else it falls back to getBoundingClientRect and event listeners for scroll and resize.

## Install

```bash
$ npm install hexo-lazyload-image --save
```

## Usage

First add configuration in `_config.yml` from your hexo project.

```yaml
lazyload:
  enable: true
  onlypost: false
  loadingImg: # eg /images/loading.gif
```
**onlypost**
- If true, only the images from post or page will support lazy-load.
- If false, the whole images of your site will use lazy-load, including the images dist from your theme, but not including the background images from CSS style.

**loadingImg**
- If you keep the value nothing (by default), then it will use the default loading image.
- If you want to customize the image, then you need to copy your loading image to your current theme image folder and then change this path to find it.

### specify **no-lazy** for specify image
we can also disable the lazy process if specify a attribute on img tag in both markdown or html
```
<img no-lazy src="abc.png" />
```

Run hexo command.

```bash
$ hexo clean && hexo g
```

## Test
I've test it manually with some popular themes like landscape(official), material, next, jacman and myself theme [hexo-theme-twentyfifteen-wordpress](https://github.com/Troy-Yang/hexo-theme-twentyfifteen-wordpress), and yours I believe!

Enjoy it!

## Demo

![image](https://images.troyyang.com/2017-7-30-lazy-load.gif)

## Thank for

[hexo-lazyload-image](https://github.com/Troy-Yang/hexo-lazyload-image)
