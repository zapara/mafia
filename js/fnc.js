//~ Версия 2.3
//~ Основной скрипт, крайне не рекомендуется что-либо менять
$(document).ready(function() {
	$titleRole='Роль';
	$titleName='Игрок';
	//Скрыть все содержание
	for ($i=1;$i<=3;$i++){$("#content #tab"+$i).hide();}
	$(".clNames").html($titleName);
	$(".clRoles").html($titleRole);
	$("#tabs li:first").attr("id","current"); // Активируем первую закладку
	$("#content #tab1").fadeIn(); // Выводим содержание

	$('#tabs a').click(function(e) {
		e.preventDefault();
		//Скрыть все содержание
		for ($i=1;$i<=3;$i++){$("#content #tab"+$i).hide();}
		$("#tabs li").attr("id",""); //Сброс ID
		$(this).parent().attr("id","current"); // Активируем закладку
		$('#' + $(this).attr('title')).fadeIn(); // Выводим содержание текущей закладки
	});

	// Переводим в текст все названия кнопок, так как они могут быть заданы в виде &#8258;
	for(i=1;i<$arBtnTitles.length;i++){
		$arBtnTitles[i]=$('<div/>').html($arBtnTitles[i]).text();
	}

	// Краткое описание ролей
	s='<h4>Обозначения:</h4><strong>'+$arBtnTitles[1]+'</strong> - Убийство мафией<br /><strong>'+$arBtnTitles[2]+'</strong> - Вор крадёт способность<br /><strong>'+
							$arBtnTitles[3]+'</strong> - Доктор лечит<br /><strong>'+$arBtnTitles[4]+'</strong> - Комиссар проверяет<br />'+
							$arBtnTitles[5]+'</strong> - Красотка спасает<br /><strong>'+$arBtnTitles[6]+'</strong> - Маньяк действует<br />'+
							$arBtnTitles[7]+'</strong> - расстрел днём<br /><strong>'+$arBtnTitles[8]+'</strong> - взрыв смертника<br />'+
							$arBtnTitles[9]+'</strong> - фол игроку<br /><br />';
	$('#dInfoSigns').html(s);

	// Регулярка для выделения номера игрока, стадии и раунда из span.id
	//$regAct=/actg(\d+)st(\d+)r(\d+)/;
	// Регулярка для выделения номера игрока при определении ролей
	$regRole=/sRole(\d+)/;
	// Регулярка для выделения номера игрока и кода действия при обработке действий
	$regID=/g(\d+)b(\d+)/;
	// Регулярка для выделения номера игрока из элемента строки
	$regRowID=/tr(\d+)/;

	$cssFolder='css/';

	$classHeader='sHeader';
	$classMaff='roleMaff';
	$classDie='gamerDie';
	$classBtnSelected='btnSelected';
	// Мирный и мафиози  всегда в игре
	$arRolePlay[1]=1;
	$arRolePlay[2]=1;

	if ($Debug) $('#dDebug').css('visibility','visible');

	// Кнопки и первоначальное значение переменных
	// Список ролей
	$select='<select>';
	for (i=1;i<$arRoles.length;i++)
		if (1==$arRolePlay[i]) $select=$select+'<option value="'+i+'">'+$arRoles[i]+'</option>';
	$select=$select+'</select>';
	$br="<br />";
	$btnNight='<input id="btnNight" type="button" onclick="RoundAdd(1)" value="Ночь" />';
	$btnDay='<input id="btnDay" type="button" onclick="RoundAdd(2)" value="День" disabled />';
	$btnClear='<input id="btnClear" type="button" onclick="Action(0,0)" value="Сбросить действия" />';
	$btnTimer='<input id="btnTimer" type="button" onclick="StartTimer()" value="Таймер" />';
	$timerID=$rows=$gamers=$died=$sitizenCnt=$maffCnt=0;
	$idImmortal=$idMedic=$idBeauty=$idDetective=$idManiac=$idThief=$idBoss=$idMaff=$maffCnt=$idBomber=0;
	$inGame=false;
	$die=$bdie=$cure=$bcure=$stole=$boom=$foul=0;

	// Назначаем роли
	$('#btnSpreadRoles').click( function(){
		$arSpread=Array();
		// Стабильно добавляем две Мафии, Доктора и Комиссара
		$arSpread.push($arRoles[2]);
		$arSpread.push($arRoles[2]);
		if (1==$arRolePlay[4]) $arSpread.push($arRoles[4]);
		if (1==$arRolePlay[5]) $arSpread.push($arRoles[5]);
		// Добавляем Красотку
		if (7<=$gamers && 1==$arRolePlay[6]) $arSpread.push($arRoles[6]);
		// Добавляем Бессмертного и Босса
		if (8<=$gamers) {
			if (1==$arRolePlay[8]) $arSpread.push($arRoles[8]);
			if (1==$arRolePlay[3]) $arSpread.push($arRoles[3]);
		}
		// Добавляем Маньяка
		if (9<=$gamers && 1==$arRolePlay[7]) $arSpread.push($arRoles[7]);
		// Добавляем Вора
		if (11<=$gamers && 1==$arRolePlay[9]) $arSpread.push($arRoles[9]);
		// Добавляем Смертника и ещё одну Мафию
		if (13<=$gamers) {
			if (1==$arRolePlay[10]) $arSpread.push($arRoles[10]);
			$arSpread.push($arRoles[2]);
		}
		// Добавляем ещё одну Мафию
		if (15<=$gamers) $arSpread.push($arRoles[2]);
		// Добавляем ещё одну Мафию
		if (18<=$gamers) $arSpread.push($arRoles[2]);

		// Очистка всех ролей, которые были ранее назначены
		$('#cover').find('select').val($arRoles[1]);
		// Собираем id span'ов, которые у нас есть в столбце ролей, чтобы назначить случайно роли
		$arSpan=Array();
		$('#cover').find('select').each(function(){
			$arSpan.push($(this).parent().attr('id'));
		});
		// Прогоняем цикл по подобранным ролям, чтобы назначить их случайным игрокам
		for ($i=0;$i<$arSpread.length;$i++){
			// Выбираем номер случайного игрока
			n=Math.floor(Math.random()*$arSpan.length);
			// Проверяем, что этому игроку не назначена уже роль, если назначена, то выбираем номер снова
			while ($arRoles[1]!=$('#'+$arSpan[n]).find("option:selected").html()) n=Math.floor(Math.random()*$arSpan.length);
			// Назначаем очередную роль выбранному игроку
			$('#'+$arSpan[n]).find('select :contains("'+$arSpread[$i]+'")').attr("selected", "selected");
		}
		// Подсчитываем остатки мафии (для вора)
		countMaff();
	});

	// Начинаем игру
	$('#btnBegin').click( function(){
		// Устанавливаем переменные в начальное состояние
		$round=0;
		$inGame=true;
		$SelfCure=false;
		$idImmortal=$idMedic=$idBeauty=$idDetective=$idManiac=$idThief=$idBoss=$idMaff=$maffCnt=$idBomber=0;
		$die=$bdie=$cure=$bcure=$stole=$boom=$foul=0;
		// Очищаем информацию для дебага
		if ($Debug) $('#dDebug').html('');
		// Отключаем добавление игроков
		$('#btnGamerAdd').attr("disabled","disabled");
		// Добавляем кнопки дня и ночи
		$('#dBtnRounds').html($btnNight+$br+$btnDay+$br+$btnClear+$br+$btnTimer);
		// Отключаем управление игроками
		$('.sBtn').css("visibility","hidden");
		// Исключаем повторное нажатие кнопки
		$('#btnBegin').attr("disabled","disabled");
		// Даём себе возможность начать заново
		$('#btnReset').attr("disabled","");
		// Запоминаем имена игроков
		$('#cover').find(":text").each(function(){
			$(this).parent().html($(this).val());
		});
		// Запоминаем роли игроков
		$('.clRoles').each(function(){
			// Если это не заголовок, то обрабатываем
			if ($titleRole!=$(this).html()) {
				// Определяем код игрока
				arr=$regRole.exec($(this).attr('id'));
				// Применяем роль к ячейке
				role=$(this).find("option:selected").html();
				$(this).html(role);

				// Отмечаем мафию цветом
				if ($arRoles[2]==role) setClass(arr[1],$classMaff);
				// Запоминаем роль босса
				if ($arRoles[3]==role) {
					$idBoss=arr[1];
					setClass(arr[1],$classMaff);
				}
				// Запоминаем роль детектива
				if ($arRoles[4]==role) $idDetective=arr[1];
				// Запоминаем роль доктора
				if ($arRoles[5]==role) $idMedic=arr[1];
				// Запоминаем роль красотки
				if ($arRoles[6]==role) $idBeauty=arr[1];
				// Запоминаем роль маньяка
				if ($arRoles[7]==role) $idManiac=arr[1];
				// Запоминаем роль бессмертного
				if ($arRoles[8]==role) $idImmortal=arr[1];
				// Запоминаем роль вора
				if ($arRoles[9]==role) $idThief=arr[1];
				// Запоминаем роль террориста
				if ($arRoles[10]==role) $idBomber=arr[1];
			}
		});
		// Подсчитываем остатки мафии (для вора)
		countMaff();
	});


	// Сброс игры, начинаем заново
	$('#btnReset').click( function(){
		if (!confirm('Точно?')) return false;
		$inGame=false;
		// Отключаем кнопку, так как нет смысла в повторном сбросе
		$('#btnReset').attr("disabled","disabled");
		// Включаем добавление игроков
		$('#btnGamerAdd').attr("disabled","");
		// Включаем назначение ролей
		$('#btnSpreadRoles').attr("disabled","");
		// Убираем кнопки дня и ночи
		$('#dBtnRounds').html("&nbsp;");
		// Включаем снова возможность начать игру
		$('#btnBegin').attr("disabled","");
		// Включаем управление игроками
		$('.sBtn').css("visibility","visible");
		// Убираем фолы
		$('.foul').html('');
		// Удаляем раунды, если они были
		$('.clRound').remove();
		// Возвращаем возможность редактировать имена
		$('.clNames > span:first-child').each(function(){
			if ($titleName!=$(this).html()) {
				$(this).html('<input type="text" class="left" value ="'+$(this).html()+'" />')
			}
		});
		// Возвращаем возможность выбирать роли
		$('.clRoles').each(function(){
			if ($titleRole!=$(this).html()) {
				// Определяем код игрока
				arr=$regRole.exec($(this).attr('id'));
				// Получаем из ячейки роль
				role=$(this).html();
				$(this).html($select);
				$(this).find('select :contains("'+$arRoles[1]+'")').attr("selected", "selected");
			}
		});
		// Убираем информацию об убитых и о мафиози
		$('.tr').removeClass($classDie);
		$('.tr').removeClass($classMaff);
	});

	// Добавляем игрока
	$('#btnGamerAdd').click( function(){
		$rows++;
		$gamers++;
		val='';
		if ($Debug) val="Игрок №"+$rows;

		$btnDel='<span class="sBtn mousehand" onclick="GamerDel('+$rows+');">-</span>'
		$btnUp='<span class="sBtn btnSmall mousehand" onclick="GamerUp('+$rows+');">▲</span>';
		$btnDown='<span class="sBtn btnSmall mousehand" onclick="GamerDown('+$rows+');">▼</span>';
		s='<div class="tr" id="tr'+$rows+'">';
		s=s+'<div class="td clNums" id="sNum'+$rows+'"><span class="sDigit">'+$rows+'</span>'+$btnDel+$btnUp+$btnDown+'</div>';
		s=s+'<div class="td clNames" id="sName'+$rows+'"><span class="left"><input type="text" class="left" value="'+val+'"/></span><span class="right foul" id="foul'+$rows+'"></span></div>';
		s=s+'<div class="td clRoles" id="sRole'+$rows+'">'+$select+'</div>';
		s=s+'</div>';
		$('#cover').append(s);

		renum();
		$sitizenCnt=$gamers;
		showInfo();
	});

});

function StartTimer(){
	if (0==$timerID) {
		$waitTime=$waitTimerDefault;
		sec=$waitTime % 60;if (10>sec) sec='0'+sec;
		min=Math.floor($waitTime / 60);

		$('#btnTimer').val(min+':'+sec);
		$timerID=setTimeout(ShowTimer, 1000);
	}
	else StopTimer();
}

function ShowTimer(){
	$waitTime++;
	sec=$waitTime % 60;if (10>sec) sec='0'+sec;
	min=Math.floor($waitTime / 60);
	$('#btnTimer').val(min+':'+sec);
	if (0<$waitTime) $timerID=setTimeout(ShowTimer, 1000);
		else StopTimer();
}

function StopTimer(){
	clearTimeout($timerID);
	$('#btnTimer').val('Таймер');
	$timerID=0;
}

function loadCSS(){
	$('#lcss').attr('href',$cssFolder+$('#sCSS').find("option:selected").val());
}

function setClass(id,cls,sett=1){
	if (1==sett){
		$('#tr'+id).addClass(cls);
	}
	else{
		$('#tr'+id).removeClass(cls);
	}
}

function renum(){
	n=1;
	$('.sDigit').each(function(){
		$(this).html(n++);
	});
}

// Подсчитываем остатки мафии (для вора)
function countMaff(){
	$maffCnt=0;
	$sitizenCnt=0;
	// Прогоняем столбик ролей
	// Если игра не началась, то смотрим select'ы
	if (!$inGame)
		$('#cover').find('select').each(function(){
			// Определяем код игрока
			arr=$regRole.exec($(this).parent().attr('id'));
			role=$(this).find('option:selected').html();
			// Подсчитываем живых мирных
			if ($arRoles[2]!=role && $arRoles[3]!=role) $sitizenCnt++;
			// Подсчитываем количество мафии
			// Это нужно для случая, если у нас есть роль вора
			// Если вдруг мафия одна, то запоминаем её id,
			// иначе просто запоминаем последний id
			if ($arRoles[2]==role) {
				$idMaff=arr[1];
				$maffCnt++;
			}
			// Босса тоже подсчитываем, но не запоминаем id
			if ($arRoles[3]==role) $maffCnt++;
		});
		// иначе смотрим span'ы
		else
		$('.clRoles').each(function(){
			if ($titleRole!=$(this).html()) {
				// Определяем код игрока
				arr=$regRole.exec($(this).attr('id'));
				// Считаем мёртвых
				if ($(this).parent().hasClass($classDie)) $died++
				// Подсчитываем живых мирных
				if ($arRoles[2]!=$(this).html() && $arRoles[3]!=$(this).html() && !$(this).parent().hasClass($classDie)) $sitizenCnt++;
				// Подсчитываем количество мафии
				// Это нужно для случая, если у нас есть роль вора
				// Если вдруг мафия одна, то запоминаем её id,
				// иначе просто запоминаем последний id
				if ($arRoles[2]==$(this).html() && !$(this).parent().hasClass($classDie)) {
					$idMaff=arr[1];
					$maffCnt++;
				}
				// Босса тоже подсчитываем, но не запоминаем id
				if ($arRoles[3]==$(this).html() && !$(this).parent().hasClass($classDie)) $maffCnt++;
			}
		});
	showInfo();
	if ($Debug) showDebugInfo();
}

// Очередной раунд
function RoundAdd(State){
	StopTimer();
	if (1==State) { // Сейчас ночь
		if (0<$round) RoundEnd(3-State); // 3-1=2 - нам надо закончить день прежде, чем начинать ночь
		$round++;
	 	$('#btnNight').attr("disabled","disabled");
		$('#btnDay').attr("disabled","");

		// Добавляем в конец всех строк таблицы
		$('.tr').each(function(){
			// Определяем ID строки
			arr=$regRowID.exec($(this).attr('id'));
			id=arr[1];
			// Если это заголовок, то просто указываем номер ночи
			if (0==id) {
				cls="th clRound";
				ee='Н'+$round;
			}
			else {
				cls="td clRound";
				ee='';
				// Если в игре есть вор, то делаем кнопку
				if (0!=$idThief) {
					// Если сам не вор и не умер и вор ещё живой...
					if (!($(this).hasClass($classDie)) && $idThief>0 )
						ee=ee+'<input type="button" id="g'+id+'b2" onclick="Action('+id+',2);" value="'+$arBtnTitles[2]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[2]+'"/>';
				}
				// Если ещё не умер, то делаем кнопку для убийства
				if (!($(this).hasClass($classDie)))
					ee=ee+'<input type="button" id="g'+id+'b1" onclick="Action('+id+',1);" value="'+$arBtnTitles[1]+'" />';
				else
					ee=ee+'<input type="button" disabled value="'+$arBtnTitles[1]+'"/>';
				// Если у нас есть в игре доктор, то делаем кнопку с лечением
				if (0!=$idMedic) {
					// Если сам не доктор (или себя ещё не лечил) и доктор не умер и игрок не мёртвый...
					if (($arRoles[5]!=$('#sRole'+id).html() || $SelfCure==false) && !$(this).hasClass($classDie) && $idMedic>0)
						ee=ee+'<input type="button" id="g'+id+'b3" onclick="Action('+id+',3);" value="'+$arBtnTitles[3]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[3]+'"/>';
				}
				// Если у нас есть в игре детектив, то делаем кнопку с его действием
				if (0!=$idDetective) {
					// Если сам не детектив и не умер и детектив ещё живой...
					if ($arRoles[4]!=$('#sRole'+id).html() && !($(this).hasClass($classDie)) && $idDetective>0)
						ee=ee+'<input type="button" id="g'+id+'b4" onclick="Action('+id+',4);" value="'+$arBtnTitles[4]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[4]+'"/>';
				}
				// Если у нас есть в игре красотка, то делаем кнопку с его действием
				if (0!=$idBeauty) {
					// Если сам не красотка и не умер и красотка ещё жива...
					if ($arRoles[6]!=$('#sRole'+id).html() && !$(this).hasClass($classDie) && $idBeauty>0)
						ee=ee+'<input type="button" id="g'+id+'b5" onclick="Action('+id+',5);" value="'+$arBtnTitles[5]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[5]+'"/>';
				}
				// Если у нас есть в игре маньяк, то делаем кнопку с его действием
				if (0!=$idManiac) {
					// Если сам не маньяк и не умер и маньяк ещё живой...
					if ($arRoles[7]!=$('#sRole'+id).html() && !($(this).hasClass($classDie)) && $idManiac>0)
						ee=ee+'<input type="button" id="g'+id+'b6" onclick="Action('+id+',6);" value="'+$arBtnTitles[6]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[6]+'"/>';
				}
				// Если используем фолы
				if ($useFouls)
					// Если игрок не умер, то кнопка фола активна
					if (!$(this).hasClass($classDie) && $useFouls)
							ee=ee+'<input type="button" id="g'+id+'b9" onclick="Action('+id+',9);" value="'+$arBtnTitles[9]+'" />';
						else
							ee=ee+'<input type="button" disabled value="'+$arBtnTitles[9]+'"/>';
				ee=ee+'</span>';
			}
			$(this).append('<div class="'+cls+'" id="actg'+id+'st'+State+'r'+$round+'">'+ee+'</span>');
		});
	}
	else { // Сейчас день
		RoundEnd(3-State); // 3-2=1 - нам надо закончить ночь прежде, чем начинать день
		$('#btnNight').attr("disabled","");
		$('#btnDay').attr("disabled","disabled");

		// Добавляем в конец всех строк таблицы
		$('.tr').each(function(){
			// Определяем ID строки
			arr=$regRowID.exec($(this).attr('id'));
			id=arr[1];
			// Если это заголовок, то просто указываем номер ночи
			if (0==id) {
				cls="th clRound";
				ee='Д'+$round;
			}
			else {
				cls="td clRound";
				ee='';
				// Определяем код игрока
				arr=$regRowID.exec($(this).attr('id'));
				// Если игрок в игре, то выводим кнопку казни
				if (!($(this).hasClass($classDie)))
					ee=ee+'<input type="button" id="g'+id+'b7" onclick="Action('+id+',7);" value="'+$arBtnTitles[7]+'" />';
				else
					ee=ee+'<input type="button" disabled value="'+$arBtnTitles[7]+'"/>';
				// Если у нас есть в игре террорист, то делаем кнопку с его действием
				if (0!=$idBomber) {
					// Если сам не террорист и не умер и террорист ещё живой...
					if ($arRoles[10]!=$('#sRole'+id).html() && !($(this).hasClass($classDie)) && $idBomber>0)
						ee=ee+'<input type="button" id="g'+id+'b8" onclick="Action('+id+',8);" value="'+$arBtnTitles[8]+'" />';
					else
						ee=ee+'<input type="button" disabled value="'+$arBtnTitles[8]+'"/>';
				}
				// Если используем фолы
				if ($useFouls)
					// Если игрок не умер, то кнопка фола активна
					if (!$(this).hasClass($classDie))
							ee=ee+'<input type="button" id="g'+id+'b9" onclick="Action('+id+',9);" value="'+$arBtnTitles[9]+'" />';
						else
							ee=ee+'<input type="button" disabled value="'+$arBtnTitles[9]+'"/>';
				ee=ee+'</span>';
			}
			$(this).append('<div class="'+cls+'" id="actg'+id+'st'+State+'r'+$round+'">'+ee+'</span>');
		});
	}
}

// Завершение очередного раунда, применение всех кнопок
function RoundEnd(State){
	if (1==State) {// Резюмируем ночные действия
		$die=$dieM=$bdie=$bdieM=$cure=$bcure=$stole=$foul=0;
		// Проходим по всем строкам таблицы
		$('.tr').each(function(){
			// Определяем ID строки (игрока)
			arr=$regRowID.exec($(this).attr('id'));
			if (0!=arr[1]){
				s='';
				// Теперь проверяем все кнопки, которые есть у игрока
				$(this).find(":button").each(function(){
					// Если кнопка отмечена, как нажатая, то обрабатываем
					if ($(this).hasClass($classBtnSelected)) {
						// Если убит, запоминаем это
						if ($arBtnTitles[1]==$(this).val()) $die=arr[1];
						if ($arBtnTitles[6]==$(this).val()) $dieM=arr[1];
						// Если игрок был вылечен, запоминаем это
						if ($arBtnTitles[3]==$(this).val()) $cure=arr[1];
						// Если этот игрок был спасён красоткой, запоминаем это
						if ($arBtnTitles[5]==$(this).val()) $bcure=arr[1];
						// Если вор украл у игрока функцию, запоминаем это
						if ($arBtnTitles[2]==$(this).val()) $stole=arr[1];
						// Если игрок получил замечание, запоминаем это и добавляем метку фола
						if ($arBtnTitles[9]==$(this).val()) {
							$foul=arr[1];
							$('#foul'+arr[1]).html($('#foul'+arr[1]).html()+$arBtnTitles[9]);
						}

						// Накапливаем значения кнопок, кроме фолов
						if ($arBtnTitles[9]!=$(this).val())
							s=s+$(this).val();
					}
				});
				$('#actg'+arr[1]+'st'+State+'r'+$round).html(s);

			}
		});
		// Предварительная проверка - вор украл способность
		if (0!=$stole){
			if ($stole==$idMedic) $cure=0;
			if ($stole==$idBeauty) $bcure=0;
			// Если вор украл способность босса или остался только один мафиози и вор украл его способность, то никто никого не убил
			if (($stole==$idBoss) || (0<=$idBoss && 1==$maffCnt && $stole==$idMaff)) $die=0;
			if ($maniacKills) {  if ($stole==$idManiac) $dieM=0; }
		}
		// Первая проверка - кого-то убили и вылечили
		if ($die==$cure || $die==$bcure) $die=0;
		if ($maniacKills) { if ($dieM==$cure || $dieM==$bcure) $dieM=0; }
		// Если вор украл способность бессмертного и бессмертного убили, то бессмертный умрёт
		if ($idImmortal==$die && $stole!=$idImmortal) $die=0;
		// Если вор украл способность бессмертного и вора убили, то вор не умрёт
		if ($idThief==$die && $stole==$idImmortal) $die=0;

		// Проверяем, не себя ли лечил доктор, если да, то помечаем
		if ($idMedic==$cure) $SelfCure=true;

		// Вторая проверка - если всё-таки не вылечили
		if (0!=$die) {
			// Если убили красотку, то умирают двое
			if ($idBeauty==$die){
				// Погибает тот, кого она спасала, если его не лечили
				if ($cure!=$bcure) $bdie=$bcure;
				$idBeauty=-$idBeauty; // Запоминаем, что красотки больше нет
			}
			// Проверяем, был ли кто из погибших доктором, и запоминаем, если да
			if ($idMedic==$die || $idMedic==$bdie) $idMedic=-$idMedic;
			// Проверяем, был ли кто из погибших маньяком, и запоминаем, если да
			if ($idManiac==$die || $idManiac==$bdie) $idManiac=-$idManiac;
			// Проверяем, был ли кто из погибших детективом, и запоминаем, если да
			if ($idDetective==$die || $idDetective==$bdie) $idDetective=-$idDetective;
			// Проверяем, был ли кто из погибших террористом, и запоминаем, если да
			if ($idBomber==$die || $idBomber==$bdie) $idBomber=-$idBomber;
			// Проверяем, был ли кто из погибших боссом, и запоминаем, если да
			if ($idBoss==$die || $idBoss==$bdie) $idBoss=-$idBoss;
		}

		// Вторая проверка для убивающего маньяка - если всё-таки не вылечили
		if ($maniacKills) {
			if (0!=$dieM) {
				// Если убили красотку, то умирают двое
				if ($idBeauty==$dieM){
					// Погибает тот, кого она спасала, если его не лечили
					if ($cure!=$bcure) $bdieM=$bcure;
					$idBeauty=-$idBeauty; // Запоминаем, что красотки больше нет
				}
				// Проверяем, был ли кто из погибших доктором, и запоминаем, если да
				if ($idMedic==$dieM || $idMedic==$bdieM) $idMedic=-$idMedic;
				// Проверяем, был ли кто из погибших маньяком, и запоминаем, если да
				if ($idManiac==$dieM || $idManiac==$bdieM) $idManiac=-$idManiac;
				// Проверяем, был ли кто из погибших детективом, и запоминаем, если да
				if ($idDetective==$dieM || $idDetective==$bdieM) $idDetective=-$idDetective;
				// Проверяем, был ли кто из погибших террористом, и запоминаем, если да
				if ($idBomber==$dieM || $idBomber==$bdieM) $idBomber=-$idBomber;
				// Проверяем, был ли кто из погибших боссом, и запоминаем, если да
				if ($idBoss==$dieM || $idBoss==$bdieM) $idBoss=-$idBoss;
			}
		}
		
		// Если после всех проверок кто-то всё-таки умер, то отмечаем это
		if (0!=$die) setClass($die,$classDie)
		if (0!=$bdie) setClass($bdie,$classDie)
		if ($maniacKills) {
			if (0!=$dieM) setClass($dieM,$classDie)
			if (0!=$bdieM) setClass($bdieM,$classDie)
		}
	}
	else {// Резюмируем дневные действия
		$die=$boom=$foul=0;
		$('.tr').each(function(){
			// Определяем ID строки (игрока)
			arr=$regRowID.exec($(this).attr('id'));
			if (0!=arr[1]){
				s='';
				// Теперь проверяем все кнопки, которые есть у игрока
				$(this).find(":button").each(function(){
					// Если кнопка отмечена, как нажатая, то обрабатываем
					if ($(this).hasClass($classBtnSelected)) {
						// Если казнён, запоминаем это
						if ($arBtnTitles[7]==$(this).val()) $die=arr[1];
						// Если взорван, запоминаем это
						if ($arBtnTitles[8]==$(this).val()) $boom=arr[1];
						// Если игрок получил замечание, запоминаем это и добавляем метку фола
						if ($arBtnTitles[9]==$(this).val()) {
							$foul=arr[1];
							$('#foul'+arr[1]).html($('#foul'+arr[1]).html()+$arBtnTitles[9]);
						}
						// Накапливаем значения кнопок, кроме фолов
						if ($arBtnTitles[9]!=$(this).val())
							s=s+$(this).val();
					}
				});
				$('#actg'+arr[1]+'st'+State+'r'+$round).html(s);
			}
		});

		// Если террорист взорвал кого-то, то голосование не имеет смысла
		// Поэтому помечаем "жертву" убитым, а самого террориста - взорвавшимся
		if (0!=$boom) {
			$die=$boom;
			$boom=$idBomber;
			// Рисуем смертнику значок, что он самовзорвался
			$('#actg'+$boom+'st'+State+'r'+$round).html($arBtnTitles[8]);
		}
		if (0!=$die || 0!=$boom) {
			// Проверяем, был ли погибший красоткой, и запоминаем, если да
			if ($idBeauty==$die || $idBeauty==$boom) $idBeauty=-$idBeauty;
			// Проверяем, был ли погибший доктором, и запоминаем, если да
			if ($idMedic==$die || $idMedic==$boom) $idMedic=-$idMedic;
			// Проверяем, был ли погибший маньяком, и запоминаем, если да
			if ($idManiac==$die || $idManiac==$boom) $idManiac=-$idManiac;
			// Проверяем, был ли погибший детективом, и запоминаем, если да
			if ($idDetective==$die || $idDetective==$boom) $idDetective=-$idDetective;
			// Проверяем, был ли погибший смертником, и запоминаем, если да
			if ($idBomber==$die || $idBomber==$boom) $idBomber=-$idBomber;
			// Проверяем, был ли погибший боссом, и запоминаем, если да
			if ($idBoss==$die || $idBoss==$boom) $idBoss=-$idBoss;
		}
		// Отмечаем выбывших
		if (0!=$die) setClass($die,$classDie)
		if (0!=$boom) setClass($boom,$classDie)
	}
	// Подсчитываем остатки мафии (для вора)
	countMaff();
}

// Действия в игровом раунде
function Action(id,n){
	if (0==n) {
		// Убираем все действия, кроме фолов
		$('.dRounds').find(':button').each(function(){
			if (''!=$(this).attr('id')){
				arr=$regID.exec($(this).attr('id'));
				if (9!=arr[2]) $(this).removeClass($classBtnSelected);
			}
		});
	}
	else {
		// Если это не установка фола, то действуем, как обычно
		if (9!=n){
			if ($('#g'+id+'b'+n).hasClass($classBtnSelected))
				$('#g'+id+'b'+n).removeClass($classBtnSelected);
			else
				for ($i=1;$i<=$rows;$i++)
					if ($i!=id) $('#g'+$i+'b'+n).removeClass($classBtnSelected);
					else $('#g'+$i+'b'+n).addClass($classBtnSelected);
		}
		// Обработка фола
		else {
			$('#g'+id+'b'+n).toggleClass($classBtnSelected)
			// Надо проверить, сколько фолов у игрока
			// Собираем все метки игрока
			s=$('#foul'+id).text();
			cnt=0;
			// Ищем метки фолов
			for (i=0;i<s.length;i++)
				if (s[i]==$arBtnTitles[9]) cnt++;
			$('#dDebug').html(cnt);
			// Если набирается три фола, то игрок потенциально мёртв
			if (($('#g'+id+'b'+n).hasClass($classBtnSelected) && $maxFoul<=cnt+1)||($maxFoul<=cnt))
				setClass(id,$classDie);
			else
				setClass(id,$classDie,0);
		}
	}
}


//Поднимаем игрока в списке
function GamerUp(n){
	// Если перед данным элементом не заголовок, то можно сдвинуть вверх
	if ('tr0'!=$('#tr'+n).prev().attr('id'))
		$('#tr'+n).prev().before($('#tr'+n))
	renum();
}
//Опускаем игрока в списке
function GamerDown(n){
	// Если за данным элементом идёт ещё один c ID, то можно сдвинуть вниз
	if (undefined!=$('#tr'+n).next().attr('id'))
		$('#tr'+n).next().after($('#tr'+n));
	renum();
}
// Удаляем игрока
function GamerDel(n){
	$('#tr'+n).remove();
	$gamers--;
	renum();
	$sitizenCnt=$gamers;
	showInfo();
}

// Показываем инфо и блокируем кнопки, ежели чо
function showInfo(){
	info='Игроков: '+($gamers-$died);
	info=info+'&nbsp;Мирных: '+$sitizenCnt+' Мафии: '+$maffCnt;
	// Минимальное количество игроков набрано, можно играть (если ужже не в игре)
	if ($minGamers<=$gamers && !$inGame) {
		$('#btnBegin').attr("disabled","");
		$('#btnSpreadRoles').attr("disabled","");
	}
	else {
		$('#btnBegin').attr("disabled","disabled");
		$('#btnSpreadRoles').attr("disabled","disabled");
	}
	$('#dInfo').html(info);
}

// Вывод данных для дебага
function showDebugInfo(){
	$('#dDebug').html(
	'Босс='+$idBoss+
	$br+'Доктор='+$idMedic+
	$br+'Комиссар='+$idDetective+
	$br+'Маньяк='+$idManiac+
	$br+'Бессмертный='+$idImmortal+
	$br+'Красотка='+$idBeauty+
	$br+'Вор='+$idThief+
	$br+'Смертник='+$idBomber+
	$br+
	$br+$arBtnTitles[1]+'='+$die+'='+$('#sRole'+$die).html()+
	$br+$arBtnTitles[1]+'='+$bdie+'='+$('#sRole'+$bdie).html()+
	$br+$arBtnTitles[2]+'='+$stole+'='+$('#sRole'+$stole).html()+
	$br+$arBtnTitles[3]+'='+$cure+'='+$('#sRole'+$cure).html()+
	$br+$arBtnTitles[5]+'='+$bcure+'='+$('#sRole'+$bcure).html()+
	$br+$arBtnTitles[8]+'='+$boom+'='+$('#sRole'+$boom).html()+
	$br+$arBtnTitles[9]+'='+$foul+'='+$('#sRole'+$foul).html()
	);
}
