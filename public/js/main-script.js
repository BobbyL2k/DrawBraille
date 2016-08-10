/*jshint esversion: 6*/

// Global
g_ = {};
init();

function init(){
    // TODO to remove
    inputImageFileElement = document.getElementById('image-file');
    imagePreviewCanvasElement = document.getElementById("image-preview-canvas");
    braillePreviewCanvasElement = document.getElementById("braille-preview-canvas");

    // Global initialization
    g_.ctx = imagePreviewCanvasElement.getContext("2d");
    g_.storage = {
        offsetX: 10,
        offsetY: 10,
        strideCoarse: 0,
        strideFine: 0.5,
        strideDiv: 1
    };

    // Initial Event Binding
    inputElementIdList = ['#printer-width', '#printer-height', '#stride-coarse', '#stride-div'];
    inputElementIdList.forEach(function(elementId) {
        console.log($(elementId));
        $(elementId).change(inputHandler);
    }, this);

    imageSliderElementIdList = ['#offset-x', '#offset-y'];
    imageSliderElementIdList.forEach(function(elementId) {
        $(elementId).slider({
            formatter: function(value) {
                return 'Current value: ' + value;
            },
            max: 100,
            value: 10,
            min: 0,
            step: 1
        }).on('slide', sliderHandler);
    }, this);
    fineSliderElementIdList = ['#stride-fine'];
    fineSliderElementIdList.forEach(function(elementId) {
        $(elementId).slider({
            formatter: function(value) {
                return 'Current value: ' + value;
            },
            max: 1,
            value: 0.5,
            min: 0,
            step: 0.001
        }).on('slide', sliderHandler);
    }, this);

    $('#ex2').slider({
        formatter: function(value) {
            return 'Current value: ' + value;
        }
    }).on('slide', sliderHandler);
}

// Event Handler
function inputHandler(inputElement) {
    valueHandler(this.name, parseInt(this.value))
}
function sliderHandler(sliderElement) {
    valueHandler(this.name, sliderElement.value);
}
function valueHandler(name, value) {
    console.log(name, value);
    value = isNaN(value) ? 0 : value;
    switch (name) {
        case 'offset-x':
            g_.storage.offsetX = value;
            break;
        case 'offset-y':
            g_.storage.offsetY = value;
            break;
        case 'stride-coarse':
            g_.storage.strideCoarse = value;
            break;
        case 'stride-fine':
            g_.storage.strideFine = value;
            break;
        case 'stride-div':
            g_.storage.strideDiv = value;
            break;

        default:
            console.log("unknown name", name);
            break;
    }
    update();
}

function update(){
    if(g_.storage.originalImageData !== undefined){
        stride = g_.storage.strideCoarse + g_.storage.strideFine;
        previewBraille(g_.storage.originalImageData, stride, stride, g_.storage.offsetY, g_.storage.offsetX, g_.storage.strideDiv);
    }
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

function previewBraille(originalImage, strideY=30, strideX=30, offsetY=10, offsetX=10, strideDiv=1) {

    originalCVImage = cv.cvtImageData2CVImage(originalImage);
    lowresCVImage = cv.stride(originalCVImage, strideY/strideDiv, strideX/strideDiv, offsetY, offsetX);

    lowresImage = cv.cvtCVImage2ImageData(lowresCVImage);
    braillePreviewCanvasElement.width = lowresImage.width;
    braillePreviewCanvasElement.height = lowresImage.height;
    braillePreviewCanvasElement.getContext("2d").putImageData(lowresImage, 0, 0);

    // Show stride
    console.log(originalCVImage);
    cv.drawStride(originalCVImage, strideY/strideDiv, strideX/strideDiv, offsetY, offsetX, cv.CONST.color[originalCVImage.type].red);
    cv.drawStride(originalCVImage, strideY, strideX, offsetY, offsetX, cv.CONST.color[originalCVImage.type].green);
    originalImage = cv.cvtCVImage2ImageData(originalCVImage);
    imagePreviewCanvasElement.getContext("2d").putImageData(originalImage, 0, 0);
}