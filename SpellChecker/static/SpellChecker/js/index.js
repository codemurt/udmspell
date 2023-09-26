var DICT={};
var TEXT;
var timer; // Таймер
let savedSelection;

//Удаление стилей текста перед вставкой и разделение на абзацы
function stripStyles(e) {
  e.preventDefault();
  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedData = clipboardData.getData('text/plain');
  const paragraphs = pastedData.split('\n');

  let formattedText = '';

  for (let i = 0; i < paragraphs.length; i++) {
    formattedText += `${paragraphs[i]}<br> `;
  }
  document.execCommand('insertHTML', false, formattedText);
}


//отслеживание изменений
var text_content=document.getElementById('text_content')
text_content.addEventListener('input', function(event) {
    clearTimeout(timer); // Сбрасываем предыдущий таймер
  // Устанавливаем новый таймер на 3 секунды
    timer = setTimeout(add_word, 3000);

});


//Добавление новых слов в DICT
function add_word(){
  console.log('таймер сработал');

  text=text_content.innerHTML;
  const newText = text.replace(/<div>/g, " <br> ");
  text_content.innerHTML=newText;

  var array_word=splitTextIntoWords(text_content.innerText);
  for (var i = 0; i < array_word.length; i++) {
    // Проверяем, есть ли слово уже в объекте
    if (!DICT.hasOwnProperty(array_word[i])) {
      // Если слова нет, то добавляем его в объект
      DICT[array_word[i]] = null;
    }
  }
  sendOnBackend();
}


//разделение текста на слова
function splitTextIntoWords(text) {
  // Удаляем знаки препинания
  const cleanText = text.replace(/[.,!?;:()"“”'–−«»]/g, '');

  // Разделяем текст на слова
  const words = cleanText.split(/\s+/);

  // Удаляем возможные пустые строки после удаления знаков препинания
  return words.filter(word => word.length > 0);
}


//отправка на сервер не проверенных слов
function sendOnBackend(){
  if(Object.keys(DICT).length===0){
    console.log('DICT пуст')
  }else {
    console.log('DICT:',DICT);
    var null_array=[];
    var k=0;
    for (const key in DICT) {
      if (DICT.hasOwnProperty(key) && DICT[key] === null) {
        k++;
        null_array.push(key);
        if(null_array.length===10){
          request_server(null_array);
          null_array=[];
        }
      }
    }
    if(null_array.length !== 0){
        request_server(null_array);
        null_array=[];
    }
    if(k===0){
        let resultText = text_content.innerHTML;
        resultText =correctDivContentText(resultText);
        document.getElementById("text_content").innerHTML = resultText;
        restoreCursorPosition();
    }
  }
}




function request_server(null_array){
  const dataToSend = {unverified_words:null_array};

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Если требуется аутентификация, вы можете добавить токен или другие заголовки сюда.
    },
    body: JSON.stringify(dataToSend),
  };

  fetch('/data_processing/', requestOptions)
    .then(response => response.json())
    .then(data => {
      // Обрабатываем ответ от сервера
      updateDICT(data.message);
    })
    .catch(error => {
      // Обрабатываем ошибку
      console.error('Ошибка:', error);
    });
}


//Обнавление DICT
function updateDICT(new_array){
    let resultText = text_content.innerHTML;

    for(var i=0; i < new_array.length; i++){
        DICT[new_array[i].word]=new_array[i].variants;
    }
    resultText =correctDivContentText(resultText);
    document.getElementById("text_content").innerHTML = resultText;

    console.log('new',DICT);
}


//Подчеркивание слов
function correctDivContentText(srcText){
    const text = srcText;
     // Разбиваем текст на слова
    text2 = text.replace(/&nbsp;/g, ' ');
    const words = text2.split(/\s+/);

     // Создаем новый HTML с подчеркнутым словом
     const highlightedText = words.map(word => {
        // Удалите пунктуацию, чтобы слова в тексте соответствовали словам в массиве
         var textValue = word.replace(/<\/?[^>]+(>|$)/g, "");
         const cleanWord = textValue.replace(/[.,!?;:()"“”'–−«»]/g, "");

         if (DICT.hasOwnProperty(cleanWord) && DICT[cleanWord] !== null && DICT[cleanWord].length > 0) {
            var j=0;
            if (word.includes("<br>")){
                j=1;
                word=textValue;
            }
            const dropdownDiv = document.createElement("div");
            dropdownDiv.className = "dropdown-container";
            const trigger = document.createElement("span");
            trigger.className = "dropdown-trigger";
            trigger.innerHTML = `${word}`;

            const list = document.createElement("ul");
            list.className = "dropdown-list";
            list.id="dropdown-list";
            for (let i = 0; i < DICT[cleanWord].length; i++) {
                const option = document.createElement("li");
                option.innerHTML = `${DICT[cleanWord][i]}`;
                list.appendChild(option);
            }

            dropdownDiv.appendChild(trigger);
            dropdownDiv.appendChild(list);

            trigger.setAttribute("onclick", "toggleListDisplayblock(this)");
            list.setAttribute("onclick", "handleOptionClick(event, this)");
            if (j===1){
                return `<div class="dropdown-container" >${dropdownDiv.innerHTML}</div><br> `;
            }else {
                return `<div class="dropdown-container" >${dropdownDiv.innerHTML}</div>`;
            }

         }else {
             return word;
         }

     }).join(" ");

     // Заменяем текст в div на подчеркнутый
     return highlightedText;
 }



function toggleListDisplayblock(the) {
    console.log("нажали");
    list=the.nextElementSibling;
    list.style.display = list.style.display === "block" ? "none" : "block";
}

function handleOptionClick(event, the) {
    console.log("нажали");
    dropdownDiv=event.currentTarget.parentElement;
    if (event.target.tagName === "LI") {
        const selectedOption = event.target.textContent;
        dropdownDiv.innerHTML = `${selectedOption}`;
        DICT[selectedOption]=[];
    }
}


document.addEventListener('click', function (event) {
  var containers = document.querySelectorAll('.dropdown-container');

  containers.forEach(function (container) {
    var ul = container.querySelector('ul');

    if (container !== event.target && !container.contains(event.target)) {
      ul.style.display = 'none';
    }
  });
});

