del .\build.zip
del /Q .\build
mkdir .\build
mkdir .\build\js
mkdir .\build\_locales
mkdir .\build\_locales\en
mkdir .\build\_locales\ru
mkdir .\build\js\vp
mkdir .\build\js\ap
mkdir .\build\js\ap\blue.monday
mkdir .\build\images
copy  .\_locales\ru\* .\build\_locales\ru\
copy  .\_locales\en\* .\build\_locales\en\
copy .\js\* .\build\js\
copy .\js\vp\* .\build\js\vp\
copy .\js\ap\* .\build\js\ap\
copy .\js\ap\blue.monday\* .\build\js\ap\blue.monday\
copy .\images\* .\build\images\
copy .\*.html .\build\
copy .\*.json .\build\
copy .\*.css .\build\

del .\build\js\vp\video-js.css
del .\build\js\vp\vim.css
del .\build\js\ap\blue.monday\jplayer.blue.monday.css
del .\build\js\background.js
del .\build\js\manager.js
del .\build\js\media.js
del .\build\js\options.js
del .\build\js\donate.js
del .\build\js\notifi.js
del .\build\js\jquery.contextmenu.css
del .\build\js\jquery.contextmenu.js
del .\build\js\jquery.timers-1.2.js
del .\build\js\jquery.ui.position.js
del .\build\js\jquery.tablesorter.js
del .\build\js\jquery.selectbox.js
del .\build\js\jquery.selectbox.css
del .\build\options.css
del .\build\donate.css
del .\build\notifi.css
del .\build\stylesheet.css
del .\build\media.css

java -jar compiler.jar --js .\js\options.js --js_output_file .\build\js\options.js
java -jar compiler.jar --js .\js\donate.js --js_output_file .\build\js\donate.js
java -jar compiler.jar --js .\js\notifi.js --js_output_file .\build\js\notifi.js
java -jar compiler.jar --js .\js\background.js --js_output_file .\build\js\background.js
java -jar compiler.jar --js .\js\manager.js --js_output_file .\build\js\manager.js
java -jar compiler.jar --js .\js\media.js --js_output_file .\build\js\media.js
java -jar compiler.jar --js .\js\graph.js --js_output_file .\build\js\graph.js
java -jar compiler.jar --js .\js\jquery.timers-1.2.js --js_output_file .\build\js\jquery.timers-1.2.js
java -jar compiler.jar --js .\js\jquery.ui.position.js --js_output_file .\build\js\jquery.ui.position.js
java -jar compiler.jar --js .\js\jquery.contextmenu.js --js_output_file .\build\js\jquery.contextmenu.js
java -jar compiler.jar --js .\js\jquery.tablesorter.js --js_output_file .\build\js\jquery.tablesorter.js
java -jar compiler.jar --js .\js\jquery.selectbox.js --js_output_file .\build\js\jquery.selectbox.js

java -jar yuicompressor-2.4.7.jar .\js\ap\blue.monday\jplayer.blue.monday.css -o .\build\js\ap\blue.monday\jplayer.blue.monday.css
java -jar yuicompressor-2.4.7.jar .\js\vp\video-js.css -o .\build\js\vp\video-js.css
java -jar yuicompressor-2.4.7.jar .\js\vp\vim.css -o .\build\js\vp\vim.css
java -jar yuicompressor-2.4.7.jar .\js\jquery.contextmenu.css -o .\build\js\jquery.contextmenu.css
java -jar yuicompressor-2.4.7.jar .\js\jquery.selectbox.css -o .\build\js\jquery.selectbox.css
java -jar yuicompressor-2.4.7.jar .\stylesheet.css -o .\build\stylesheet.css
java -jar yuicompressor-2.4.7.jar .\media.css -o .\build\media.css
java -jar yuicompressor-2.4.7.jar .\options.css -o .\build\options.css
java -jar yuicompressor-2.4.7.jar .\notifi.css -o .\build\notifi.css
java -jar yuicompressor-2.4.7.jar .\donate.css -o .\build\donate.css
start "7zip" "C:\Program Files\7-Zip\7zG.exe" a D:\System\uTiny\build.zip D:\System\uTiny\build\*