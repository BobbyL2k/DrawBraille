/*jshint esversion: 6*/

// Global cv object
cv = {
    CONST:{
        types: ["RGBA", "RGB", "G", "B"],
        chCount: {
            RGBA: 4,
            RGB:  3,
            G:    1,
            B:    1
        }
    }
};

(function cvInit(){

    class CVImage {
        // CV Image
        constructor(height, width, type="RGBA"){
            this._height = validatePositiveZ(height);
            this._width = validatePositiveZ(width);
            this._type = validateImageType(type);
            this._chLength = cv.CONST.chCount[type]
            this._data = new Uint8ClampedArray(this._height * this._width * this._chLength);
        }
        get width(){
            return this._width;
        }
        get height(){
            return this._height;
        }
        get type(){
            return this._type;
        }
        get(y, x, ch=0){
            return this._data[y*this._width*this._chLength + x*this._chLength + ch];
        }
        set(value, y, x, ch=0){
            this._data[y*this._width*this._chLength + x*this._chLength + ch] = value;
        }
    }
    cv.CVImage = CVImage;

    cv.isValidType = isValidType;
    function isValidType(type){
        return cv.CONST.types.find(type) !== undefined;
    }
    cv.validateImageType = validateImageType;
    function validateImageType(type){
        if(!isValidType) throw "Invalid Type";
        return type;
    }
    function validatePositiveZ(value){
        if(value < 0) throw "Invalid Value: Negative";
        return value;
    }

    cv.stride = stride;
    function stride(image, strideY, strideX, offsetY=0.0, offsetX=0.0){
        resultImageWidth = Math.floor( (image.width - offsetX) / strideX );
        resultImageHeight = Math.floor( (image.height - offsetY) / strideY );
        resultImage = new CVImage(resultImageHeight, resultImageWidth, image.type);

        temp = 0;
        for(cy=0; cy<resultImageHeight; cy++){
            for(cx=0; cx<resultImageWidth; cx++){
                for(ch=0; ch<3; ch++){
                    value = image.get(
                        Math.round(offsetY + cy*strideY),
                        Math.round(offsetX + cx*strideX),
                        ch);
                    resultImage.set(value, cy, cx, ch);
                    temp++;
                }
                resultImage.set(255, cy, cx, 3);
            }
        }
        return resultImage;
    }

    cv.cvtImageData2CVImage = cvtImageData2CVImage;
    function cvtImageData2CVImage(imageData){
        cvImage = new CVImage(imageData.height, imageData.width);
        cvImage._data = imageData.data;
        return cvImage;
    }
    cv.cvtCVImage2ImageData = cvtCVImage2ImageData;
    function cvtCVImage2ImageData(cvImage){
        imageData = new ImageData(cvImage.width, cvImage.height);
        switch (cvImage.type) {
            case "RGBA":
                imageData.data = cvImage._data;
                dataSize = cvImage.height * cvImage.width * 4;
                for(var c=dataSize-1; c>=0; c--)
                    imageData.data[c] = cvImage._data[c];
                break;
            case "RGB":
                pixelCount = cvImage.height * cvImage.width;
                for(var c=pixelCount-1; c>=0; c--)
                    imageData.data[c+0] = cvImage._data[c+0];
                    imageData.data[c+1] = cvImage._data[c+1];
                    imageData.data[c+2] = cvImage._data[c+2];
                    imageData.data[c+3] = 255;
                break;
            case "G":
                pixelCount = cvImage.height * cvImage.width;
                for(var c=pixelCount-1; c>=0; c--)
                    imageData.data[c+0] = cvImage._data[c];
                    imageData.data[c+1] = cvImage._data[c];
                    imageData.data[c+2] = cvImage._data[c];
                    imageData.data[c+3] = 255;
                break;
            case "B":
                pixelCount = cvImage.height * cvImage.width;
                for(var c=pixelCount-1; c>=0; c--)
                    value = cvImage._data[c] ? 255 : 0;
                    imageData.data[c+0] = value;
                    imageData.data[c+1] = value;
                    imageData.data[c+2] = value;
                    imageData.data[c+3] = 255;
                break;
        }
        return imageData;
    }

    // Browser's Image toolset namespace
    cv.bimg = {};
    (function(){
        cv.bimg.stride = stride;
        function stride(ctx, image, strideY, strideX, offsetY=0, offsetX=0){
            // stride the image
            resultImageWidth = Math.floor( (image.width - offsetX) / strideX );
            resultImageHeight = Math.floor( (image.height - offsetY) / strideY );
            resultImage = ctx.createImageData(resultImageWidth, resultImageHeight);

            for(cy=0; cy<resultImageHeight; cy++){
                for(cx=0; cx<resultImageWidth; cx++){
                    for(ch=0; ch<3; ch++){
                        value = image_get(
                            image,
                            Math.round(offsetY + cy*strideY),
                            Math.round(offsetX + cx*strideX),
                            ch);
                        image_set(resultImage, cy, cx, ch, value);
                    }
                    image_set(resultImage, cy, cx, 3, 255);
                }
            }
            return resultImage;
        }

        cv.bimg.image_set = image_set;
        function image_set(image, y, x, ch, value){
            // setting value from browser's Image object
            image.data[((y*(image.width*4)) + (x*4)) + ch] = value;
        }

        cv.bimg.image_get = image_get;
        function image_get(image, y, x, ch){
            // getting value from browser's Image object
            return image.data[((y*(image.width*4)) + (x*4)) + ch]
        }
    })();

})();

(function debug(){
    console.log(cv);
})();