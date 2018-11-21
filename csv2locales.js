// run with node.js
// will load all files from input directory,
// convert them as csv2json,
// and put results in output directory

function csv2jsonDirectoryConverter(cfg) {
	var path = require('path');
	var fs = require('fs');
	// we should install csv module for node!
	var parse = require('csv-parse/lib/sync');

	var inputFiles = [];
	var resource = {};
	var languages = [];
	var csvDir = cfg.inputCsvDirectory || 'input_csv';
	var jsonDir = cfg.outputJsonDirectory || 'output_json';

	function readDir() {
		fs.readdir(csvDir, processFiles);
	}

	function processFiles(err, files) {
		if (err) {
			throw err;
		}
		inputFiles = files.filter(s => s.includes('.csv'));
		console.log('starting conversion');
		while(processNextFile()) {}
	}

	function processNextFile() {
		var fileName = "";
		console.log('files remaining: ' + inputFiles.length);
		if (!inputFiles.length) {
			return false;
		}
		fileName = inputFiles.pop();
		var fileLang = fileName.substring(0, fileName.length - 4);
		languages = [fileLang];
		console.log('reading ' + fileName + ' for lang code ' + fileLang);
		// fs.createReadStream(path.join(csvDir, fileName)).pipe(parser);
		var fileContents = fs.readFileSync(path.join(csvDir, fileName))
		var data = parse(fileContents, {delimiter: ','})
    var index;
    for(index=0; index < data.length; index++) {
      processCsvRecord(data[index], index);
    }
    saveResults();
		return true;
	}

	var parser = 
	});

	function processCsvRecord(recordArr, index) {
		// ignore empty row
		if (!recordArr[0]) {
			console.log('empty record');
			return;
		}

		var keysArr = recordArr[0].split('.');
		var currentValue;
		var prevValue;
		var lastKey;
		for(var i=0; i<languages.length; i++) {
			if (recordArr[i+1] === false) {
				continue;
			}

      if (!resource[languages[i]] || !resource[languages[i]]['translation']){
        resource[languages[i]] = {
          translation : {}
        };
      }

			// save empty values for key for en lang
			// these means missing keys fall back to en if set
			// en falls back to blank instead of printing the key
			if (recordArr[i+1] === null && languages[i] === 'en') {
				recordArr[i+1] = ''
			}

			currentValue = resource[languages[i]]['translation'];
			for(var j=0; j<keysArr.length; j++) {
				prevValue = currentValue;
				lastKey = keysArr[j];
				if (! prevValue[lastKey] ) {
					prevValue[lastKey] = {};
				}
				currentValue = prevValue[lastKey];
			}

			prevValue[lastKey] = recordArr[i+1];
		}
	}

	function saveResults() {
		var lang = {};
		for(lang in resource) {
			console.log('saving language: ' + lang);
  		saveFile(jsonDir, lang+'.json', JSON.stringify(resource[lang], null, " "));
		}
	}

	function saveFile(dir, fileName, data) {
		fs.writeFile(path.join(dir, fileName), data, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log(fileName+" file was saved!");
			}
		});
	}

	return {
		start: function() {
			if (!csvDir || !jsonDir) {
				console.log("Error: directories not specified");
				return;
			}
			readDir();
		}
	};
}

// start up:
// we should install configure module for node!
var config = require("configure");
var converter = csv2jsonDirectoryConverter(config);
converter.start();
