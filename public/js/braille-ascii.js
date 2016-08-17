/*jshint esversion: 6*/

braille = {};

(function () {
    brailleDotData = JSON.parse('{" ": [0,0,0,0,0,0],"!": [0,1,1,0,1,1],"\\"": [0,0,0,1,0,0],"#": [0,1,0,1,1,1],"$": [1,1,1,0,0,1],"%": [1,1,0,0,0,1],"&": [1,1,1,0,1,1],"\'": [0,0,0,0,1,0],"(": [1,0,1,1,1,1],")": [0,1,1,1,1,1],"*": [1,0,0,0,0,1],"+": [0,1,0,0,1,1],",": [0,0,0,0,0,1],"-": [0,0,0,0,1,1],".": [0,1,0,0,0,1],"/": [0,1,0,0,1,0],"0": [0,0,0,1,1,1],"1": [0,0,1,0,0,0],"2": [0,0,1,0,1,0],"3": [0,0,1,1,0,0],"4": [0,0,1,1,0,1],"5": [0,0,1,0,0,1],"6": [0,0,1,1,1,0],"7": [0,0,1,1,1,1],"8": [0,0,1,0,1,1],"9": [0,0,0,1,1,0],":": [1,0,0,1,0,1],";": [0,0,0,1,0,1],"<": [1,0,1,0,0,1],"=": [1,1,1,1,1,1],">": [0,1,0,1,1,0],"?": [1,1,0,1,0,1],"@": [0,1,0,0,0,0],"A": [1,0,0,0,0,0],"B": [1,0,1,0,0,0],"C": [1,1,0,0,0,0],"D": [1,1,0,1,0,0],"E": [1,0,0,1,0,0],"F": [1,1,1,0,0,0],"G": [1,1,1,1,0,0],"H": [1,0,1,1,0,0],"I": [0,1,1,0,0,0],"J": [0,1,1,1,0,0],"K": [1,0,0,0,1,0],"L": [1,0,1,0,1,0],"M": [1,1,0,0,1,0],"N": [1,1,0,1,1,0],"O": [1,0,0,1,1,0],"P": [1,1,1,0,1,0],"Q": [1,1,1,1,1,0],"R": [1,0,1,1,1,0],"S": [0,1,1,0,1,0],"T": [0,1,1,1,1,0],"U": [1,0,0,0,1,1],"V": [1,0,1,0,1,1],"W": [0,1,1,1,0,1],"X": [1,1,0,0,1,1],"Y": [1,1,0,1,1,1],"Z": [1,0,0,1,1,1],"[": [0,1,1,0,0,1],"\\\\": [1,0,1,1,0,1],"]": [1,1,1,1,0,1],"^": [0,1,0,1,0,0],"_": [0,1,0,1,0,1]}');
    dot2BALT = {}; // Dot to Braille-ASCII Lookup Table
    BA2DotLT = {}; // Braille-ASCII to Dot Lookup Table


    ////////////////////////
    // Data               //
    // [0, 1, 2, 3, 4, 5] //
    //                    //
    // Braille Dot        //
    // 0 1                //
    // 2 3                //
    // 4 5                //
    ////////////////////////

    (function generateLookupTable(){
        for(var brailleAscii in brailleDotData){
            dotPatern = binaryListToNumbers(brailleDotData[brailleAscii]);
            dot2BALT[dotPatern] = brailleAscii;
            BA2DotLT[brailleAscii] = dotPatern;
        }
    })();

    function binaryListToNumbers(bList){
        var result = 0;
        for(var c=0; c<bList.length; c++)
            result = result*2 + bList[c];
        return result;
    }

    braille.BCVImage2BrailleAscii = BCVImage2BrailleAscii;
    function BCVImage2BrailleAscii(CVImage){
        validateCVImageType(CVImage.type);
        function validateCVImageType(CVImageType) { 
            if(CVImageType != "B") throw "BCVImage2BrailleAscii conversion failed: Input not a Binary Image"; 
        }
        function getPixelSafe(CVImage, y, x){
            if(x < 0 || CVImage.width <= x || y < 0 || CVImage.height <= y){
                console.log(x, y, CVImage.width, CVImage.height);
                return 0;
            }
            else{
                return CVImage.get(y, x);
            }
        }
        var lines = [];
        for(var cy=0; cy<CVImage.height; cy+=3){
            var line = "";
            for(var cx=0; cx<CVImage.width; cx+=2){
                var boxNumList = [
                    getPixelSafe(CVImage, cy  , cx  ),
                    getPixelSafe(CVImage, cy  , cx+1),
                    getPixelSafe(CVImage, cy+1, cx  ),
                    getPixelSafe(CVImage, cy+1, cx+1),
                    getPixelSafe(CVImage, cy+2, cx  ),
                    getPixelSafe(CVImage, cy+2, cx+1) 
                ];
                console.log(boxNumList);
                line += dot2BALT[binaryListToNumbers(boxNumList)];
            }
            line += '\n';
            lines.push(line);
        }
        return lines;
    }
    braille.DownloadBCVImageAsVimFile = DownloadBCVImageAsVimFile;
    function DownloadBCVImageAsVimFile(CVImage, filename="braille.vim"){
        lines = BCVImage2BrailleAscii(CVImage);
        // .vim file header
        lines.unshift("1\n");
        var blob = new Blob(lines, {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename);
    }
})() ;