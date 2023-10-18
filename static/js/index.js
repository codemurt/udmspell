var DICT={};
var TEXT;
var timer, count_symbol=0, count_word=0, count_error=0; // Таймер
let savedSelection;
var spans=0;
let currentIndex = -1; // Индекс текущего выделенного слова


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


var text_content=document.getElementById('text_content');

const placeholder = document.getElementById('placeholder');
const inform = document.getElementById('inform');
const btn1=document.getElementById('error_btn');
const btn2=document.getElementById('error_btn2');

var divCountSymbol=document.getElementById('count_symbol');
var divCountWord=document.getElementById('count_word');
var divCountError=document.getElementById('count_error');

divCountSymbol.textContent=count_symbol;
divCountWord.textContent=count_word;
divCountError.textContent=count_error;


//отслеживание изменений
text_content.addEventListener('input', function(event) {
    clearTimeout(timer); // Сбрасываем предыдущий таймер

    count_symbol=text_content.textContent.length;
    togglePlaceholder();

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

  count_word=array_word.length;
  divCountWord.textContent=count_word;

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

        count_error=countTags();
        divCountError.textContent=count_error;
        if(count_error>1){
          btn1.style.display='inline-block';
          btn2.style.display='inline-block';

        }else{
          btn1.style.display='none';
          btn2.style.display='none';
        }
    }
  }
}




function request_server(check_candidates){

  const dataToSend = {unverified_words:check_candidates};
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

    count_error=countTags();
    divCountError.textContent=count_error;
    if(count_error>1){
      btn1.style.display='inline-block';
      btn2.style.display='inline-block';

    }else{
      btn1.style.display='none';
      btn2.style.display='none';
    }
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
            /*
            const dropdownDiv = document.createElement("div");
            dropdownDiv.className = "dropdown-container";

            const trigger = document.createElement("span");
            trigger.className = "dropdown-trigger";
            trigger.innerHTML = `${word}`;

            DivCorrect=document.createElement("div");
            DivCorrect.id = "rightWordDiv";
            DivCorrect.setAttribute('contenteditable', 'false');

            DivCorrect.innerHTML=`<div id="lineOne"><img src="/static/images/!.png">    Ихтимал булған төҙәтмә</div>`;

            const list = document.createElement("ul");
            list.id="dropdownlist";
            for (let i = 0; i < DICT[cleanWord].length; i++) {
                const option = document.createElement("li");
                option.innerHTML = `${DICT[cleanWord][i]}`;
                list.appendChild(option);
            }
            list.setAttribute("onclick", "handleOptionClick(event, this)");


            DivCorrect.appendChild(list);
            DivCorrect.innerHTML += `<button id="ignor" onclick='ignorError(event)'><img id="ignor_img" src="/static/images/new_ignor.png" alt=""><span id="t_ig">Ҡалдырырға</span></button>`;

            dropdownDiv.appendChild(trigger);

            dropdownDiv.appendChild(DivCorrect);

            trigger.setAttribute("onclick", "toggleListDisplayblock(this)");
            */
            if (j===1){
                return `<span class='dropdown-trigger' onclick='toggleListDisplayblock(event)'>${word}</span><br> `;
            }else {
                return `<span class='dropdown-trigger' onclick='toggleListDisplayblock(event)'>${word}</span>`;
            }

         }else {
             return word;
         }

     }).join(" ");

     // Заменяем текст в div на подчеркнутый
     return highlightedText;
 }


DivCorrect=document.createElement("div");
DivCorrect.id = "rightWordDiv";
DivCorrect.setAttribute('contenteditable', 'false');

DivCorrect.innerHTML=`<div id="lineOne"><img src="/static/images/!.png">    Ихтимал булған төҙәтмә</div>`;

const list_v = document.createElement("ul");
list_v.id="dropdownlist";
list_v.setAttribute("onclick", "handleOptionClick(event, this)");
DivCorrect.appendChild(list_v);

var ignorButton = document.createElement('button');
ignorButton.id = 'ignor';
ignorButton.setAttribute('onclick', 'ignorError(event)');

var img = document.createElement('img');
img.id = 'ignor_img';
img.src = '/static/images/new_ignor.png';
img.alt = '';

var leave= document.createElement('span');
leave.id = 't_ig';
leave.innerText = 'Ҡалдырырға';

ignorButton.appendChild(img);
ignorButton.appendChild(leave);

DivCorrect.appendChild(ignorButton);
DivCorrect.style.display='block';



function toggleListDisplayblock(event) {
  var textValue = event.target.textContent.replace(/<\/?[^>]+(>|$)/g, "");
  var cleanWord = textValue.replace(/[.,!?;:()"“”'–−«»]/g, "");

  list_v.innerHTML = "";
  for (let i = 0; i < DICT[cleanWord].length; i++) {
      const option = document.createElement("li");
      option.innerHTML = `${DICT[cleanWord][i]}`;
      list_v.appendChild(option);
  }

  event.target.insertAdjacentElement('afterend', DivCorrect);

  rect1 = text_content.getBoundingClientRect();
  var spanRect = event.target.getBoundingClientRect();
  // Позиционируем rightWordDiv под span
  DivCorrect.style.left = spanRect.left - rect1.left + 'px';

  rect2 = DivCorrect.getBoundingClientRect();
  overlapRight = rect2.right - rect1.right;

  if (overlapRight > 0) {
    DivCorrect.style.right='0px';
    DivCorrect.style.left='auto';
  }
}


function handleOptionClick(event, the) {
    if(currentIndex>-1){
      currentIndex--;
    }
    span_teg=event.currentTarget.parentElement.previousElementSibling;
    if (event.target.tagName === "LI") {
        const selectedOption = event.target.textContent;
        span_teg.outerHTML = `${selectedOption}`;
        cleanWord = selectedOption.replace(/[.,!?;:()"“”'–−«»]/g, "");
        DICT[cleanWord]=[];
    }
    count_error=countTags();
    divCountError.textContent=count_error;
    if(count_error>1){
      btn1.style.display='inline-block';
      btn2.style.display='inline-block';

    }else{
      btn1.style.display='none';
      btn2.style.display='none';
    }
}


function ignorError(event){
    if(currentIndex>-1){
      currentIndex--;
    }
    span_teg=event.currentTarget.parentElement.previousElementSibling;
    ignorWord=event.currentTarget.parentElement.previousElementSibling.textContent;
    cleanWord = ignorWord.replace(/[.,!?;:()"“”'–−«»]/g, "");
    span_teg.outerHTML=`${ignorWord}`;
    DICT[cleanWord]=[];
    count_error=countTags();
    divCountError.textContent=count_error;
    if(count_error>1){
      btn1.style.display='inline-block';
      btn2.style.display='inline-block';

    }else{
      btn1.style.display='none';
      btn2.style.display='none';
    }
}


var dbl_btn=document.getElementById('dbl_btn');

document.addEventListener('click', function (event) {
  var containers = document.getElementById('rightWordDiv');

  if (containers && containers !== event.target && event.target !== containers.previousElementSibling && dbl_btn!==event.target && !dbl_btn.contains(event.target)) {
    text_content.removeChild(containers);
  }
});


// Функция для отображения/скрытия начальной подсказки и информации
function togglePlaceholder() {
  const placeholder = document.getElementById('placeholder');
  const inform = document.getElementById('inform');
  if (text_content.textContent === '') {
    placeholder.style.display = 'block';
    inform.style.display='none';
  } else {
    placeholder.style.display = 'none';
    inform.style.display='block';
    divCountSymbol.textContent=count_symbol;

    //count_error=3;
    if(count_error>1){
      btn1.style.display='inline-block';
      btn2.style.display='inline-block';

    }else{
      btn1.style.display='none';
      btn2.style.display='none';
    }
  }
}


//количество ошибок в тексте
function countTags() {
  var textContent = document.getElementById('text_content').innerHTML;
  var regex = new RegExp('<' + 'span' + '\\b', 'gi');
  var matches = textContent.match(regex);

  spans = document.querySelectorAll(".dropdown-trigger");

  return matches ? matches.length : 0;
}


function cleanTextContainer(){
  text_content.innerHTML='';
  DICT={};
  placeholder.style.display = 'block';
  inform.style.display='none';
  divCountSymbol.textContent=0;
  divCountWord.textContent=0;
  divCountError.textContent=0;
  btn1.style.display='none';
  btn2.style.display='none';
  currentIndex = -1;
}


function CopyText(){
  text_content.focus();
  document.execCommand('selectAll'); // Выделить весь текст
  document.execCommand('copy'); // Скопировать выделенный текст
  window.getSelection().removeAllRanges();
}


var back_btn=document.getElementById('error_btn');
var next_btn=document.getElementById('error_btn2');
next_btn.setAttribute("onclick", "nextWord()");
back_btn.setAttribute("onclick", "backWord()");


function next_back(event) {
  var textValue = event.textContent.replace(/<\/?[^>]+(>|$)/g, "");
  var cleanWord = textValue.replace(/[.,!?;:()"“”'–−«»]/g, "");

  list_v.innerHTML = "";
  for (let i = 0; i < DICT[cleanWord].length; i++) {
      const option = document.createElement("li");
      option.innerHTML = `${DICT[cleanWord][i]}`;
      list_v.appendChild(option);
  }

  event.insertAdjacentElement('afterend', DivCorrect);

  rect1 = text_content.getBoundingClientRect();
  var spanRect = event.getBoundingClientRect();
  // Позиционируем rightWordDiv под span
  DivCorrect.style.left = spanRect.left - rect1.left + 'px';

  rect2 = DivCorrect.getBoundingClientRect();
  overlapRight = rect2.right - rect1.right;

  if (overlapRight > 0) {
    DivCorrect.style.right='0px';
    DivCorrect.style.left='auto';
  }
}


  // Функция для выделения следующего слова
  function nextWord() {
    if (currentIndex < spans.length - 1) {
      if(currentIndex === -1){
        currentIndex++;
        next_back(spans[currentIndex]);
      }else{
        list=spans[currentIndex].nextElementSibling;
        if (list.tagName === 'DIV'){
          text_content.removeChild(list);
        }
        currentIndex++;
        next_back(spans[currentIndex]);
      }
    }
  }

  // Функция для выделения предыдущего слова
  function backWord() {
    if (currentIndex > 0) {
      list=spans[currentIndex].nextElementSibling;
      if (list.tagName === 'DIV'){
        text_content.removeChild(list);
      }
      currentIndex--;
      next_back(spans[currentIndex]);
    }
  }