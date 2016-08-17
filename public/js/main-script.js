/*jshint esversion: 6, browser: true, devel: true*/
/*globals $:false, ManagedCanvas:false, cv:false*/
"use strict";

(function(){
    // Impure Scope
    // Global
    var g_ = {};

    (function init(){
        // TODO to remove
        g_.inputImageFileElement = document.getElementById('image-file');
        g_.imagePreviewCanvas = new ManagedCanvas("image-preview-canvas");
        g_.stridePreviewCanvas = new ManagedCanvas("stride-preview-canvas");
        g_.braillePreviewCanvas = new ManagedCanvas("braille-preview-canvas");

        // Global initialization
        g_.storage = {
            offsetX: 10,
            offsetY: 10,
            strideCoarse: 100,
            strideFine: 0.0,
            strideDiv: 1,
            thresholdRange: [125,225]
        };

        // Initial Event Binding
        $('#image-file').change(loadImageHandler);
        var inputElementIdList = ['#printer-width', '#printer-height', '#stride-coarse', '#stride-div'];
        inputElementIdList.forEach(function(elementId) {
            $(elementId).change(inputHandler);
        }, this);
        var offsetSliderElementIdList = ['#offset-x', '#offset-y'];
        offsetSliderElementIdList.forEach(function(elementId) {
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
        var fineSliderElementIdList = ['#stride-fine'];
        fineSliderElementIdList.forEach(function(elementId) {
            $(elementId).slider({
                formatter: function(value) {
                    return 'Current value: ' + value;
                },
                max: 1,
                value: 0.0,
                min: 0,
                step: 0.001
            }).on('slide', sliderHandler);
        }, this);
        $('#threshold-value').slider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        }).on('slide', sliderHandler);
    })();

    // Event Handler
    function inputHandler(inputEvent) {
        valueHandler(inputEvent.target.name, parseInt(inputEvent.target.valueAsNumber));
    }
    function sliderHandler(sliderEvent) {
        valueHandler(sliderEvent.target.name, sliderEvent.value);
    }
    function valueHandler(name, value) {
        // console.log(name, value);

        if(isNaN(value) && !Array.isArray(value)){
            value = 0;
        }
        var willUpdate = true;
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
            case 'threshold-value':
                g_.storage.thresholdRange = value;
                break;

            default:
                console.log("unknown name", name);
                willUpdate = false;
                break;
        }
        if(willUpdate)
            update();
    }
    function loadImageHandler() {
        console.log("Loading Image");

        var input, file, fr, loadedImage;

        if (typeof window.FileReader !== 'function') {
            write("The file API isn't supported on this browser yet.");
            return;
        }

        input = g_.inputImageFileElement;
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
            loadedImage = new Image();
            loadedImage.onload = imageLoaded;
            loadedImage.src = fr.result;
        }

        function imageLoaded() {
            g_.imagePreviewCanvas.width = loadedImage.width;
            g_.imagePreviewCanvas.height = loadedImage.height;
            g_.imagePreviewCanvas.context.drawImage(loadedImage, 0, 0);
            g_.storage.originalCVImage = g_.imagePreviewCanvas.canvasCVImage;
            update();
        }

        function write(msg) {
            var p = document.createElement('p');
            p.innerHTML = msg;
            document.body.appendChild(p);
        }
    }

    function update(){
        if(g_.storage.originalCVImage !== undefined){
            var stride = {
                strideX: g_.storage.strideCoarse + g_.storage.strideFine,
                strideY: g_.storage.strideCoarse + g_.storage.strideFine,
                offsetY: g_.storage.offsetY,
                offsetX: g_.storage.offsetX,
                strideDiv: g_.storage.strideDiv,
            };
            var canvas = {
                imagePreviewCanvas: g_.imagePreviewCanvas,
                stridePreviewCanvas: g_.stridePreviewCanvas,
                braillePreviewCanvas: g_.braillePreviewCanvas
            };
            previewBraille(g_.storage.originalCVImage, stride, g_.storage.thresholdRange, canvas);
        }
    }
})();


function previewBraille(originalCVImage, stride, thresholdRange, canvas) {

    /// Image Preview ViewPort
    var originalCVImageClone = originalCVImage.clone();
    // Draw red stride (divided)
    cv.drawStride(originalCVImageClone, stride.strideY/stride.strideDiv, stride.strideX/stride.strideDiv, stride.offsetY, stride.offsetX, cv.CONST.color[originalCVImageClone.type].red);
    // Draw green stride (grid) (placed 2nd to overlap red stride)
    cv.drawStride(originalCVImageClone, stride.strideY, stride.strideX, stride.offsetY, stride.offsetX, cv.CONST.color[originalCVImageClone.type].green);
    // Set image-preview image to canvas
    canvas.imagePreviewCanvas.cvImage = originalCVImageClone;
    canvas.imagePreviewCanvas.redraw();

    /// Recommendation Stride value
    var strideDim = cv.strideDimension(originalCVImageClone, stride.strideY, stride.strideX, stride.offsetY, stride.offsetX);
    var resolutionMessage = "Current resolution is " + strideDim.height + " x " + strideDim.width;
    console.log(resolutionMessage);
    // label.currentOutputImageResolution = resolutionMessage;

    /// Stride ViewPort
    // originalCVImage -- apply stride -> lowresCVImage
    var lowresCVImage = cv.stride(originalCVImage, stride.strideY/stride.strideDiv, stride.strideX/stride.strideDiv, stride.offsetY, stride.offsetX);
    // set stride-preview image to canvas
    canvas.stridePreviewCanvas.cvImage = lowresCVImage;
    canvas.stridePreviewCanvas.redraw();


    /// Thresholding (Braille) ViewPort
    // lowresCVImage -- apply thresholding -> brailleCVImage
    var lowerbound = [thresholdRange[0], thresholdRange[0], thresholdRange[0], 0];
    var upperbound = [thresholdRange[1], thresholdRange[1], thresholdRange[1], 255];
    var brailleCVImage = cv.inRange(lowresCVImage, lowerbound, upperbound);
    // Set braille-preview image to canvas
    canvas.braillePreviewCanvas.cvImage = brailleCVImage;
    canvas.braillePreviewCanvas.redraw();
}