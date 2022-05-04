var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
var recognition;
var synth = window.speechSynthesis;
var targetLang;
var sourceLang;

$( document ).ready(function() {
	//load source laguage dropdown
	for (var i = 0; i < langs.length; i++) {
		source_language.options[i] = new Option(langs[i][0], i);
	}
	
	//load target laguage dropdown
	for (var i = 0; i < langs.length; i++) {
		target_language.options[i] = new Option(langs[i][0], i);
	}

	// Set default source language / dialect.
	source_language.selectedIndex = 10;
	updateSourceCountry();
	source_dialect.selectedIndex = 11;
	
	// Set default target language / dialect.
	target_language.selectedIndex = 27;
	updateTargetCountry();
	target_dialect.selectedIndex = 0;

	if (!('webkitSpeechRecognition' in window)) {
		upgrade();
	} else {
		showInfo('start');
		start_button.style.display = 'inline-block';
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;

		recognition.onstart = function() {
			recognizing = true;
			showInfo('speak_now');
			document.getElementById("demo").innerHTML = '';
			addMicAnimation();
		};

		recognition.onerror = function(event) {
			if (event.error == 'no-speech') {
				showInfo('no_speech');
				ignore_onend = true;
			}
			if (event.error == 'audio-capture') {
				showInfo('no_microphone');
				ignore_onend = true;
			}
			if (event.error == 'not-allowed') {
				if (event.timeStamp - start_timestamp < 100) {
					showInfo('blocked');
				} else {
					showInfo('denied');
				}
				ignore_onend = true;
			}
			removeMicAnimation();
		};

		recognition.onend = function() {
			recognizing = false;
			// recognizing = true;
			if (ignore_onend) {
				return;
			}
			removeMicAnimation();
			if (!final_transcript) {
				showInfo('start');
				return;
			}
			showInfo('stop');
			if (window.getSelection) {
				window.getSelection().removeAllRanges();
				var range = document.createRange();
				range.selectNode(document.getElementById('final_span'));
				window.getSelection().addRange(range);

				translate(final_transcript);
			} 
		};

		recognition.onresult = function(event) {
			var interim_transcript = '';
			if (typeof (event.results) == 'undefined') {
				recognition.onend = null;
				recognition.stop();
				upgrade();
				return;
			}
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					if(isMobile()){
						final_transcript = event.results[i][0].transcript;
					} else {
						final_transcript += event.results[i][0].transcript;
					}
				} 
				else {
					if(isMobile()){
						interim_transcript = event.results[i][0].transcript;
					} else {
						interim_transcript += event.results[i][0].transcript;
					}
				}
			}
			final_transcript = capitalize(final_transcript);
			final_span.innerHTML = linebreak(final_transcript);
			interim_span.innerHTML = linebreak(interim_transcript);
		};
	}
});

function updateSourceCountry() {
	for (var i = source_dialect.options.length - 1; i >= 0; i--) {
		source_dialect.remove(i);
	}
	var list = langs[source_language.selectedIndex];
	for (var i = 1; i < list.length; i++) {
		source_dialect.options.add(new Option(list[i][1], list[i][0]));
	}
	source_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

function updateTargetCountry() {
	for (var i = target_dialect.options.length - 1; i >= 0; i--) {
		target_dialect.remove(i);
	}
	var list = langs[target_language.selectedIndex];
	for (var i = 1; i < list.length; i++) {
		target_dialect.options.add(new Option(list[i][1], list[i][0]));
	}
	target_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

function upgrade() {
	start_button.style.visibility = 'hidden';
	showInfo('upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
	return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
	return s.replace(first_char, function(m) {return m.toUpperCase();});
}

$("#start_button").click(function () {
	if (recognizing) {
	   recognition.stop();
	   removeMicAnimation();
//	   recognizing = false;
//	   showInfo('start');
	   return;
	}
	final_transcript = '';
	recognition.lang = source_dialect.value;
	sourceLang = source_dialect.value;
	targetLang = target_dialect.value;
	recognition.start();
	ignore_onend = false;
	final_span.innerHTML = '';
	interim_span.innerHTML = '';
	addMicAnimation();
	showInfo('allow');
	start_timestamp = event.timeStamp;
});

function showInfo(s) {
	if (s) {
	    var message = messages[s];
	    $("#message").removeClass();
	    $("#message").html(message.msg);
	    $("#message").addClass(message.class);
	} else {
	    $("#message").removeClass();
	    $("#message").addClass('d-none');
	}
}

function removeMicAnimation() {
	$("#micIcon").removeClass("circle");
	$("#micIcon").removeClass("pulse");
}

function addMicAnimation(){
	$("#micIcon").addClass("circle");
	$("#micIcon").addClass("pulse");
}

function isMobile(){
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

//currently not used
function copyToClipboard() {
  if (document.selection) { 
      var range = document.body.createTextRange();
      range.moveToElementText(document.getElementById('results'));
      range.select().createTextRange();
      document.execCommand("copy");   
  } else if (window.getSelection) {
      var range = document.createRange();
       range.selectNode(document.getElementById('results'));
       window.getSelection().addRange(range);
       document.execCommand("copy");
  }
  showInfo('copy');
}

function translate(inputText) {
	let text = inputText.trim();
	
    translateFrom = sourceLang;
    translateTo = targetLang;
	
    if(!text || text == '') {
		console.log("Please speak something...");
		return;
	}

    let apiUrl = `https://api.mymemory.translated.net/get?q=${text}&langpair=${translateFrom}|${translateTo}`;
    fetch(apiUrl).then(res => res.json()).then(data => {
        var translatedText = data.responseData.translatedText;
        data.matches.forEach(data => {
            if(data.id === 0) {
				translatedText = data.translation;
            }
        });
		console.log("Translation: "+translatedText);
		document.getElementById("demo").innerHTML = data.responseData.translatedText;
		textToSpeech(translatedText);
    });
}

function textToSpeech(text){
    let utterance = new SpeechSynthesisUtterance(text);
    for(let voice of synth.getVoices()){
        if(voice.name === 'Google हिन्दी'){
            utterance.voice = voice;
        }
    }
    synth.speak(utterance);
}