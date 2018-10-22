// run with node.js
// will load all files from input directory, 
// convert them as csv2json,
// and put results in output directory

function csv2jsonDirectoryConverter(cfg) {
	var path = require('path');
	var fs = require('fs');
	// we should install csv module for node!
	var parse = require('csv-parse');
	// we should install yamljsyamljs module for node!
	var yamljs = require('yamljs');

	var inputFiles = [];
	var resource = {};
	var languages = [];
	var csvDir = cfg.inputCsvDirectory || 'input_csv';
	var jsonDir = cfg.outputJsonDirectory || 'output_json';
	var ymlDir = cfg.outputYmlDirectory || 'output_yml';

	var parser = parse({delimiter: ','}, function(err, data) {
		if(err) {
			console.log(err);
		} else {
			var index;
			for(index=0; index < data.length; index++) {
				processCsvRecord(data[index], index);
			}
			saveResults();
		}
	});
	
	function processCsvRecord(recordArr, index) {
		// ignore empty row
		if (!recordArr[0]) {
			console.log('empty record');
			return;
		}
		
		if (!languages.length) {
			languages = recordArr.slice(1);
			for(var i=0; i<languages.length; i++) {
				if (!resource[languages[i]] || !resource[languages[i]]['translation']){
					resource[languages[i]] = {
						translation : {}
					};
				}
			}
			console.log('languages: ' + JSON.stringify(languages));
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

	function saveFile(dir, fileName, data) {
		fs.writeFile(path.join(dir, fileName), data, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log(fileName+" file was saved!");
			}
		});		
	}

	function saveLanguage(langName, langObj) {
		saveFile(jsonDir, langName+'.json', JSON.stringify(langObj, null, " "));
		/* do not save yaml
		saveFile(jsonDir, langName+'.json', JSON.stringify(langObj['translation'], null, " "));
		var tmpObj = {};
		tmpObj[langName] = langObj['translation'];
		saveFile(ymlDir, langName+'.yml', '---\n'+yamljs.stringify(tmpObj, 4));
		*/
	}
	
	function saveResults() {
		var lang = {};
		for(lang in resource) {
			console.log('saving language: ' + lang);
			saveLanguage(lang, resource[lang]);
		}
	}
	
	function processNextFile() {
		var fileName = "";
		console.log('files remaining: ' + inputFiles.length);
		if (!inputFiles.length) {
			return false;
		}
		fileName = inputFiles.pop();
		languages = [];
		console.log('reading ' + fileName);
		fs.createReadStream(path.join(csvDir, fileName)).pipe(parser);
		return true;
	}
	
	function processFiles(err, files) {
		if (err) {
			throw err;
		}
		inputFiles = files.filter(s => s.includes('.csv'));
		console.log('starting conversion');
		while(processNextFile()) {}
	}

	function readDir() {
		fs.readdir(csvDir, processFiles);
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
