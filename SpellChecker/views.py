from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


def index(request):
    return render(request, 'SpellChecker/index.html')


def spellChecker(unverified_words):
    correct=[]
    for i in range(len(unverified_words)):
        if len(unverified_words[i])<=3:
            correct.append({'word': unverified_words[i],'variants':[unverified_words[i], 'вариант1', 'вариант2', 'вариант3']})
        else:
            correct.append({'word': unverified_words[i],'variants':[]})
    return correct

@csrf_exempt  # Используйте это только для простоты, лучше настроить аутентификацию и авторизацию.
def data_processing(request):
    if request.method == 'POST':
        # Получаем данные из запроса
        data = json.loads(request.body)

        correct=spellChecker(data['unverified_words'])

        # Возвращаем ответ
        response_data = {'message': correct}
        return JsonResponse(response_data)
    else:
        # Если запрос не POST, то вернуть ошибку
        return JsonResponse({'error': 'Метод не разрешен'}, status=405)




