/*jshint esversion: 6*/

// Global
g_ = {};
cv = {
    stride: function stride(ctx, image, strideY, strideX, offsetY=0, offsetX=0){
        resultImageWidth = Math.floor( (image.width - offsetX) / strideX );
        resultImageHeight = Math.floor( (image.height - offsetY) / strideY );
        resultImage = ctx.createImageData(resultImageWidth, resultImageHeight);

        for(cy=0; cy<resultImageHeight; cy++){
            for(cx=0; cx<resultImageWidth; cx++){
                for(ch=0; ch<3; ch++){
                    value = cv.image_get(
                        image, 
                        Math.round(offsetY + cy*strideY), 
                        Math.round(offsetX + cx*strideX), 
                        ch);
                    cv.image_set(resultImage, cy, cx, ch, value);
                }
                cv.image_set(resultImage, cy, cx, 3, 255);
            }
        }
        return resultImage;
    },
    image_set: function image_set(image, y, x, ch, value){
        image.data[((y*(image.width*4)) + (x*4)) + ch] = value;
    },
    image_get: function image_get(image, y, x, ch){
        // console.log(image, image.data)
        return image.data[((y*(image.width*4)) + (x*4)) + ch]
    }
};
init();

function init(){
    inputImageFileElement = document.getElementById('image-file');
    imagePreviewCanvasElement = document.getElementById("image-preview-canvas");
    braillePreviewCanvasElement = document.getElementById("braille-preview-canvas");
    g_.ctx = imagePreviewCanvasElement.getContext("2d");
    g_.storage = {};
}

function loadImage() {
    console.log("Loading Image");
    var input, file, fr, img;

    if (typeof window.FileReader !== 'function') {
        write("The file API isn't supported on this browser yet.");
        return;
    }

    input = inputImageFileElement;
    if (!input) {
        write("Um, couldn't find the imgfile element.");
    }
    else if (!input.files) {
        write("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
        write("Please select a file before clicking 'Load'");
    }
    else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = createImage;
        fr.readAsDataURL(file);
    }

    function createImage() {
        img = new Image();
        img.onload = imageLoaded;
        img.src = fr.result;
    }

    function imageLoaded() {
        var canvas = imagePreviewCanvasElement;
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        g_.storage.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        previewBraille(g_.storage.originalImageData);
    }

    function write(msg) {
        var p = document.createElement('p');
        p.innerHTML = msg;
        document.body.appendChild(p);
    }
}

function previewBraille(originalImage, a=20, b=20, c=30, d=30) {
    canvas = braillePreviewCanvasElement;
    var ctx = canvas.getContext("2d");
    lowresImage = cv.stride(ctx, originalImage, a, b, c, d);
    console.log(lowresImage)
    canvas.width = lowresImage.width;
    canvas.height = lowresImage.height;
    console.log(canvas.width, canvas.height)
    ctx.putImageData(lowresImage, 0, 0);
}