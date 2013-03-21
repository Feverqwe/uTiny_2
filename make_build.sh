#!/bin/sh
find . -name ".DS_Store" -exec rm {} \;
rm ./build.zip
rm -r ./build
mkdir ./build
cp -r ./_locales ./build/.
cp -r ./js ./build/.
cp -r ./images ./build/.
cp -r ./css ./build/.
cp *.html ./build/.
cp *.json ./build/.

java -jar compiler.jar --js ./js/options.js --js_output_file ./build/js/options.js
java -jar compiler.jar --js ./js/background.js --js_output_file ./build/js/background.js
java -jar compiler.jar --js ./js/manager.js --js_output_file ./build/js/manager.js
java -jar compiler.jar --js ./js/graph.js --js_output_file ./build/js/graph.js
java -jar compiler.jar --js ./js/jquery.contextmenu.js --js_output_file ./build/js/jquery.contextmenu.js
java -jar compiler.jar --js ./js/jquery.tablesorter.js --js_output_file ./build/js/jquery.tablesorter.js
java -jar compiler.jar --js ./js/jquery.selectbox.js --js_output_file ./build/js/jquery.selectbox.js
java -jar compiler.jar --js ./js/apprise-1.5.min.js --js_output_file ./build/js/apprise-1.5.min.js

java -jar yuicompressor-2.4.7.jar ./js/jquery.contextmenu.css -o ./build/js/jquery.contextmenu.css
java -jar yuicompressor-2.4.7.jar ./js/jquery.selectbox.css -o ./build/js/jquery.selectbox.css
java -jar yuicompressor-2.4.7.jar ./css/stylesheet.css -o ./build/css/stylesheet.css
java -jar yuicompressor-2.4.7.jar ./css/options.css -o ./build/css/options.css
java -jar yuicompressor-2.4.7.jar ./css/apprise.min.css -o ./build/css/apprise.min.css

cd ./build/
zip -r ../build.zip ./