/*jshint esversion: 6, browser: true, devel: true*/
/*globals $:false, ManagedCanvas:false, cv:false*/

(function(){
    "use strict";
    // Impure Scope
    // Global
    var g_ = {};

    (function init(){
        // TODO to remove
        g_.inputImageFileElement = document.getElementById('image-file');
        g_.imagePreviewCanvas = new ManagedCanvas("image-preview-canvas");
        g_.stridePreviewCanvas = new ManagedCanvas("stride-preview-canvas");
        g_.braillePreviewCanvas = new ManagedCanvas("braille-preview-canvas");
        g_.currentBrailleImageResolutionDiv = $('#current-braille-image-resolution');
        g_.inputImageResolutionDiv = $("#input-image-resolution")

        // Global initialization (defalut values)
        g_.storage = {
            offsetX: 10,
            offsetY: 10,
            strideCoarse: 100,
            strideFine: 0.0,
            strideDiv: 1,
            thresholdRange: [0,128],
            printerWidth: 120,
            printerHeight: 120
        };
        g_.systemStorage = {
            brailleCVImage: undefined
        };

        // Initial Event Binding
        $('#image-file').change(loadImageHandler);
        var inputElementIdList = ['printer-width', 'printer-height', 'stride-coarse', 'stride-div'];
        inputElementIdList.forEach(function(elementId) {
            var $element = $('#'+elementId)
            $element.change(inputHandler);
            $element.val(g_.storage[hyphen2camel(elementId)]);
        }, this);
        var offsetSliderElementIdList = ['offset-x', 'offset-y'];
        offsetSliderElementIdList.forEach(function(elementId) {
            $('#'+elementId).slider({
                formatter: function(value) {
                    return `Current value: ${value}`;
                },
                max: 100,
                value: g_.storage[hyphen2camel(elementId)],
                min: 0,
                step: 1
            }).on('slide', sliderHandler);
        }, this);
        var fineSliderElementIdList = ['#stride-fine'];
        fineSliderElementIdList.forEach(function(elementId) {
            $(elementId).slider({
                formatter: function(value) {
                    return `Current value: ${value}`;
                },
                max: 1,
                value: g_.storage[hyphen2camel(elementId)],
                min: 0,
                step: 0.001
            }).on('slide', sliderHandler);
        }, this);
        $('#threshold-range').slider({
            formatter: function(value) {
                return `Current value: ${value}`;
            },
            max: 255,
            value: g_.storage[hyphen2camel('threshold-range')],
            min: 0,
            step: 1
        }).on('slide', sliderHandler);
        $('#save-vim').click(function(e){
            if(g_.systemStorage.brailleCVImage !== undefined){
                console.log(braille.BCVImage2BrailleAscii(g_.systemStorage.brailleCVImage));
                braille.DownloadBCVImageAsVimFile(g_.systemStorage.brailleCVImage);
            }
        });
    })();

    // Helper functions
    function camel2hyphen(str){ return str.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase(); }); }
    function hyphen2camel(str){ return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }); }

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
        var match = false;
        for(var key in g_.storage){
            if(name == camel2hyphen(key)){
                g_.storage[key] = value;
                match = true;
            }
        }
        if(match) {
            update();
        }
        else {
            console.log("unknown name", name);
        }
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
                imagePreview: g_.imagePreviewCanvas,
                stridePreview: g_.stridePreviewCanvas,
                braillePreview: g_.braillePreviewCanvas
            };
            var label = {
                currentBrailleImageResolution: g_.currentBrailleImageResolutionDiv,
                inputImageResolution: g_.inputImageResolutionDiv
            };
            g_.systemStorage.brailleCVImage = 
                previewBraille(g_.storage.originalCVImage, stride, g_.storage.thresholdRange, canvas, label);
        }
    }
})();


function previewBraille(originalCVImage, stride, thresholdRange, canvas, label) {
    "use strict";

    /// Image Resolution Message
    var inputImageResolutionMessage = `Image resolution is ${originalCVImage.height} x ${originalCVImage.width}`;
    label.inputImageResolution.text(inputImageResolutionMessage);

    /// Image Preview ViewPort
    var originalCVImageClone = originalCVImage.clone();
    // Draw red stride (divided)
    cv.drawStride(originalCVImageClone, stride.strideY/stride.strideDiv, stride.strideX/stride.strideDiv, stride.offsetY, stride.offsetX, cv.CONST.color[originalCVImageClone.type].red);
    // Draw green stride (grid) (placed 2nd to overlap red stride)
    cv.drawStride(originalCVImageClone, stride.strideY, stride.strideX, stride.offsetY, stride.offsetX, cv.CONST.color[originalCVImageClone.type].green);
    // Set image-preview image to canvas
    canvas.imagePreview.cvImage = originalCVImageClone;
    canvas.imagePreview.redraw();

    /// Recommendation Stride value Message
    var resolutionMessage = "";
    // var maxStrideDivValue = min(
    //     originalCVImageClone.width
    // );
    // originalCVImageClone.width
    // originalCVImageClone.height
    var strideDim = cv.strideDimension(originalCVImageClone, stride.strideY/stride.strideDiv, stride.strideX/stride.strideDiv, stride.offsetY, stride.offsetX);
    resolutionMessage += `Current braille resolution is ${strideDim.height} x ${strideDim.width}`;
    label.currentBrailleImageResolution.text(resolutionMessage);

    /// Stride ViewPort
    // originalCVImage -- apply stride -> lowresCVImage
    var lowresCVImage = cv.stride(originalCVImage, stride.strideY/stride.strideDiv, stride.strideX/stride.strideDiv, stride.offsetY, stride.offsetX);
    // set stride-preview image to canvas
    canvas.stridePreview.cvImage = lowresCVImage;
    canvas.stridePreview.redraw();


    /// Thresholding (Braille) ViewPort
    // lowresCVImage -- apply thresholding -> brailleCVImage
    var lowerbound = [thresholdRange[0], thresholdRange[0], thresholdRange[0], 0];
    var upperbound = [thresholdRange[1], thresholdRange[1], thresholdRange[1], 255];
    var brailleCVImage = cv.inRange(lowresCVImage, lowerbound, upperbound);
    // Set braille-preview image to canvas
    canvas.braillePreview.cvImage = brailleCVImage;
    canvas.braillePreview.redraw();
    return brailleCVImage;
}