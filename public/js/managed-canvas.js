/*jshint esversion: 6, browser: true*/

class ManagedCanvas{
    constructor(canvasElement){
        if(typeof canvasElement == "string")
            canvasElement = document.getElementById(canvasElement);
        if(canvasElement === undefined)
            throw "ManagedCanvas init with 'undefined' canvasElement";
        this._canvasElement = canvasElement;
        this._cvImage = undefined;
    }

    redraw(){
        if(this.cvImage !== undefined){
            var image = cv.cvtCVImage2ImageData(this.cvImage);
            this.canvasElement.getContext("2d").putImageData(image, 0, 0);
        }
    }
    get cvImage(){
        return this._cvImage;
    }
    set cvImage(cvImage){
        if(cvImage instanceof cv.CVImage == false)
            throw "ManagedCanvas set image with non cv.CVImage instance";
        this._cvImage = cvImage;
        // Config HTML's canvas dimenstion
        this.canvasElement.width = cvImage.width;
        this.canvasElement.height = cvImage.height;
    }
    get canvasElement(){
        return this._canvasElement;
    }
    get context(){
        return this.canvasElement.getContext("2d");
    }
    get canvasCVImage(){
        return cv.cvtImageData2CVImage(
            this.context.getImageData(
                0,
                0,
                this.canvasElement.width,
                this.canvasElement.height));
    }
    set height(height){
        this.canvasElement.height = height
    }
    set width(width){
        this.canvasElement.width = width
    }
}