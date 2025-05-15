let numExperts = 0;
let numCriteria = 0;
let numAlternative = 0;
let quantitativeLimitsOptions = "";
let formattedQuantitativeLimitsOptions = "";
let qualitativeScaleOptions = "";
let qualitativeScaleValues = {};
let scalesFromOntology = {};
let criteriaLimits = {};
let doesFileResultExist = false;
let result = {}
let limits = [];
let data = {
    "abstractionLevels": [
        {
            "abstractionLevelID": "group1",
            "abstractionLevelName": "Abstraction level no. 1"
        }
    ],
    "abstractionLevelWeights": {
        "group1": 1.0
    },
    "scales": [],
    "criteria": {
        "group1": []
    },
    "alternatives": [],
    "expertWeightsRule": {
        "1": 1.0
    },
    "expertWeights": {},
    "experts": [],
    "estimations": {}
};

/*
1. Изменить "Элементы" - сделать в виде матрицы
2. После добавления новой альтернативы изобразить в правом большом окне в виде двух окон, где слева старая версия (без альтернативы), а справа новая версия с дополнительной альтернативой
3. сделать сравнение id с существующими при добавлении новой альтернативы
4. может добавить units, но пока хз
5. ещё подебажить
 */

/*
Блок заимствованного кода
 */
function loadScalesFromOntology() {
    return new Promise((resolve, reject) => {
        $.getJSON('/load-scales', function (data) {
            scalesFromOntology = data;
            qualitativeScaleOptions = "";
            qualitativeScaleValues = {};
            let index = 0;
            for (let key in scalesFromOntology) {
                index++;
                qualitativeScaleOptions += `<option value="S${index}">S${index} (${key})</option>`;
                qualitativeScaleValues[`S${index}`] = scalesFromOntology[key].join(", ");
            }
            console.log(qualitativeScaleValues);
            $("#scales-fields-for-qualitative").html(Object.entries(scalesFromOntology).map(([key, values], i) =>
`<div><strong>S${i+1} (${key}):</strong> ${values.join(", ")}</div>`).join(''));
            resolve();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Error loading scales from ontology: ", textStatus, errorThrown);
            reject(textStatus);
        });
    });
}

function loadQuantitativeScales() {
    return new Promise((resolve, reject) => {
        $.getJSON('/load-quantitative-scales', function (data) {
            console.log("Loaded quantitative scales: ", data);
            quantitativeLimitsOptions = Object.entries(data).map(([key, {
                                min,
                                max
                            }
                        ], i) =>
`<option value="${key}">R${i+1} (${key}): Minimum: ${min}, Maximum: ${max}</option>`).join('');
            formattedQuantitativeLimitsOptions = Object.entries(data).map(([key, {
                                min,
                                max
                            }
                        ], i) => {
                    criteriaLimits[key] = max;
                    return `<div><strong>R${i+1} (${key})</strong>: Minimum: ${min}, Maximum: ${max}</div>`;
                }).join('');
            console.log("Criteria Limits after loading: ", criteriaLimits);
            $("#scales-fields-for-quantitative").html(formattedQuantitativeLimitsOptions);
            resolve();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Error loading quantitative scales: ", textStatus, errorThrown);
            reject(textStatus);
        });
    });
}

function getSelectedCriteriaLimits() {
    return new Promise((resolve, reject) => {
        let selectedLimits = [];
        $('.criteria-block').each(function () {
            let limitSelect = $(this).find('select[id^="criteria-"][id$="-limit-select"]');
            let selectedLimit = limitSelect.find('option:selected').text();
            let key = selectedLimit.match(/\(([^)]+)\)/)[1];
            let maxLimit = criteriaLimits[key];
            selectedLimits.push(maxLimit);
        });
        limits = selectedLimits;
        resolve(selectedLimits);
    });
}


/*
Конец блока
 */


$(".blue-btn-again").click(function () {
    let blocks = document.querySelectorAll(".criteria-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".expert-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".alternative-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".alternative-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".evaluations-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".res-block");
    blocks.forEach(block => block.remove());

    blocks = document.querySelectorAll(".infoAboutExperts");
    blocks.forEach(block => block.remove());
    $("#experts").hide();

    blocks = document.querySelectorAll(".infoAboutCriteria");
    blocks.forEach(block => block.remove());
    $("#criteria").hide();

    blocks = document.querySelectorAll(".infoAboutAlternative");
    blocks.forEach(block => block.remove());
    $("#alternatives").hide();
    function deleteFile() {
        return $.ajax({
            url: "/cleanup", // API на сервере, возвращающее статус файла
            method: "POST",
            dataType: "json"
        });
    }
    deleteFile().done(function(response) {
        console.log("Ответ сервера:", response);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Ошибка при вызове cleanup:", textStatus);
    });

    numExperts = 0;
    numCriteria = 0;
    numAlternative = 0;
    $("#main-modal").show();
    $("#meaningful-modal").show();
    $("#experts-modal").hide();
    $("#number-of-criteria-modal").hide()
    $("#alternatives-modal").hide();
    $("#criteria-modal").hide();
    $("#number-alternatives-modal").hide();
    $("#evaluation-modal").hide();
    $("#result-modal").hide();
    $("#result-left-modal").hide();

})




$(document).ready(function () {
    function deleteFile() {
        return $.ajax({
            url: "/cleanup", // API на сервере, возвращающее статус файла
            method: "POST",
            dataType: "json"
        });
    }
    deleteFile().done(function(response) {
        console.log("Ответ сервера:", response);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Ошибка при вызове cleanup:", textStatus);
    });
    loadQuantitativeScales();
    loadScalesFromOntology();
    $("#submit-btn").click(function () {
        if (numExperts !== parseInt($("#experts-input").val())) {
            numExperts = parseInt($("#experts-input").val());
            if (numExperts > 0 && numExperts <= 50) {
                $("#main-modal").hide();
                $("#experts-modal").show();
                let expertFields = "";
                for (let i = 1; i <= numExperts; i++) {
                    expertFields += `<div class="expert-block" id="expert-block-${i}"><span class="bold-text">Эксперт ${i}:</span><br>`;
                    expertFields += `<div class="row_experts"><label for="expert-${i}-name" style="padding-top: 6px">Имя:</label> <input type="text" id="expert-${i}-name" name="expert-${i}-name" placeholder="Text" required></div>`;
                    expertFields += `<div class="row_experts"><label for="expert-${i}-id" style="padding-top: 6px">ID:</label> <input type="text" id="expert-${i}-id" name="expert-${i}-id" placeholder="Text" required></div>`;
                    expertFields += `<div class="row_experts"><label for="expert-${i}-competence" style="padding-top: 6px">Компетенция:</label> <input type="text" id="expert-${i}-competence" name="expert-${i}-competence" placeholder="Text" required><br></div></div>`;
                }
                $("#experts-fields").html(expertFields);


            } else {
                console.log("Нужно ввести число от 1 до 50!")
            }
        } else {
            $("#main-modal").hide();
            $("#experts-modal").show();
        }
    });
})

$("#back-btn-to_number-of-experts").click(function () {
    $("#experts-modal").hide();
    /*
    let block = document.querySelector("#experts");
    block.innerHTML = "";
     */
    $("#main-modal").show();
});

$("#submit-btn-to-number-of-criteria").click(function () {
    let allFilled = true
    for (let i = 1; i <= numExperts; i++) {
        if ($(`#expert-${i}-name`).val() === "") {
            $(`#expert-${i}-name`).css("border", "2px solid red");
            allFilled = false
        } else {
            $(`#expert-${i}-name`).css("border", "");
        }
        if ($(`#expert-${i}-id`).val() === "") {
            $(`#expert-${i}-id`).css("border", "2px solid red");
            allFilled = false
        } else {
            $(`#expert-${i}-id`).css("border", "");
        }
        if ($(`#expert-${i}-competence`).val() === "") {
            $(`#expert-${i}-competence`).css("border", "2px solid red");
            allFilled = false
        } else {
            $(`#expert-${i}-competence`).css("border", "");
        }
    }
    let goodId = true;
    for (let i = 1; i < numExperts; i++) {
        for (let j = i + 1; j <=numExperts; j++) {
            if ($(`#expert-${i}-id`).val() === $(`#expert-${j}-id`).val()) {
                $(`#expert-${i}-id`).css("border", "2px solid red");
                $(`#expert-${j}-id`).css("border", "2px solid red");
                goodId = false;
            }
        }
    }
    if (allFilled && goodId) {
        let infoAboutExperts = ""
        infoAboutExperts += '<div class="infoAboutExperts" style="margin-bottom: 10px"><span style="font-size: 24px">Эксперты</span></div>'
        for (let i = 1; i < numExperts; i++) {
            let id = document.getElementById(`expert-${i}-id`).value;
            let name = document.getElementById(`expert-${i}-name`).value;
            let comp = document.getElementById(`expert-${i}-competence`).value;
            infoAboutExperts += `<div class="infoAboutExperts" style="margin-bottom: 5px"><span class="bold-text">Эксперт ${i}: ID: ${id};  Имя: ${name};  Компетенция: ${comp}</span></div>`;
        }
        let id = document.getElementById(`expert-${numExperts}-id`).value;
        let name = document.getElementById(`expert-${numExperts}-name`).value;
        let comp = document.getElementById(`expert-${numExperts}-competence`).value;
        infoAboutExperts += `<div class="infoAboutExperts"><span class="bold-text">Эксперт ${numExperts}: ID: ${id};  Имя: ${name};  Компетенция: ${comp}</span></div>`;
        $("#experts").html(infoAboutExperts).show();

        $("#meaningful-fields").show();
        $("#experts-modal").hide();
        $("#warningExperts").hide();
        $("#number-of-criteria-modal").show();
    } else {
        if (!goodId && !allFilled) {
            document.getElementById("Experts-warning-text").textContent = "Неверный ввод (совпадают id или заполнены не все поля)"
        } else if (!goodId) {
            document.getElementById("Experts-warning-text").textContent = "Id экспертов совпадают"
        } else {
            document.getElementById("Experts-warning-text").textContent = "Не все поля заполнены"
        }
        $("#warningExperts").show();
    }
});

$("#back-btn-to-fields-of-criteria").click(function () {
    $("#number-alternatives-modal").hide();
    $("#criteria-modal").show();
});



$("#back-btn-to-fields-of-experts").click(function () {
    $("#number-of-criteria-modal").hide();
    $("#experts-modal").show();
});


/*
    Заполнение альтернатив
 */
$("#submit-btn-to-alternatives").click(function () {
    if (numAlternative !== parseInt($("#alternatives-input").val())) {
        numAlternative = parseInt($("#alternatives-input").val());
        if (numAlternative > 0 && numAlternative < 20) {
            $("#number-alternatives-modal").hide();
            $("#alternatives-modal").show();
            let alternativeFields = ""
            for (let i = 1; i <= numAlternative; i++) {
                alternativeFields += `<div class="alternative-block" id="alternative-block-${i}"><span class="bold-text" style="padding-bottom: 5px">Альтернатива ${i}:</span>`;
                alternativeFields += `<div class="row_alternatives"><label for="alternative-${i}-id" style="padding-top: 6px">ID:</label> <input type="text" id="alternative-${i}-id" name="alternative-${i}-id" required></div>`;
                alternativeFields += `<div class="row_alternatives"><label for="alternative-${i}-name" style="padding-top: 6px">Название:</label> <input type="text" id="alternative-${i}-name" name="alternative-${i}-name" required><br></div></div>`;
            }
            $("#alternatives-fields").html(alternativeFields)
        }
    } else {
        $("#number-alternatives-modal").hide();
        $("#alternatives-modal").show();
    }
});



$("#back-btn-to_number-of-alternatives").click(function () {
    $("#alternatives-modal").hide();
    $("#number-alternatives-modal").show();
});


$("#submit-btn-to-criteria").click(function () {
    if (numCriteria !== parseInt($("#criteria-input").val())) {
        numCriteria = parseInt($("#criteria-input").val());
        if (numCriteria > 0 && numCriteria < 20) {
            $("#number-of-criteria-modal").hide();
            $("#criteria-modal").show();
            let criteriaFields = "";
            for (let i = 1; i <= numCriteria; i++) {
                criteriaFields += `<div class="criteria-block" id="criteria-block-${i}"><strong style="padding-bottom: 3px">Критерий ${i}:</strong>`;
                criteriaFields += `<div class="row-criterias"><label for="criteria-${i}-id" style="padding-top: 6px">ID:</label> <input type="text" id="criteria-${i}-id" name="criteria-${i}-id" required><br></div>`;
                criteriaFields += `<div class="row-criterias"><label for="criteria-${i}-name" style="padding-top: 6px">Имя:</label> <input type="text" id="criteria-${i}-name" name="criteria-${i}-name" required><br></div>`;
                criteriaFields += `<div class="row-criterias"><label for="criteria-${i}-qualitative" style="padding-top: 4px">Качественный критерий:</label> <select id="criteria-${i}-qualitative" name="criteria-${i}-qualitative"><option value="false">false</option><option value="true">true</option></select><br></div>`;
                criteriaFields += `<div class="row-criterias" id="criteria-${i}-scale" style="display: none;"><label for="criteria-${i}-scale-select"">Выберите шкалу:</label> <select id="criteria-${i}-scale-select" name="criteria-${i}-scale-select"></select><br></div>`;
                criteriaFields += `<div class="row-criterias" id="criteria-${i}-limit"><label for="criteria-${i}-limit-select" style="padding-top: 10px">Ограничение:</label> <select id="criteria-${i}-limit-select" name="criteria-${i}-limit-select">${quantitativeLimitsOptions}</select><br></div>`;
                criteriaFields += `</div>`;
            }
            $("#criteria-fields").html(criteriaFields);

            for (let i = 1; i <= numCriteria; i++) {
                $(`#criteria-${i}-qualitative`).change(function () {
                    if ($(this).val() === "true") {
                        $(`#criteria-${i}-scale`).show();
                        $(`#criteria-${i}-limit`).hide();
                        $(`#criteria-${i}-scale-select`).html(qualitativeScaleOptions);
                    } else {
                        $(`#criteria-${i}-scale`).hide();
                        $(`#criteria-${i}-limit`).show();
                    }
                });
            }

        }
    } else {
        $("#number-of-criteria-modal").hide();
        $("#criteria-modal").show();
    }
})

$("#submit-btn-to-number-of-alternatives").click(function () {
    let allFilled = true
    console.log($("#criteria-1-scale").val());
    for (let i = 1; i <= numCriteria; i++) {
        if ($(`#criteria-${i}-id`).val() === "") {
            $(`#criteria-${i}-id`).css("border", "2px solid red");
            allFilled = false
        }
        if ($(`#criteria-${i}-name`).val() === "") {
            $(`#criteria-${i}-name`).css("border", "2px solid red");
            allFilled = false
        }
    }
    let goodId = true;
    for (let i = 1; i < numCriteria; i++) {
        for (let j = i + 1; j <=numCriteria; j++) {
            if ($(`#criteria-${i}-id`).val() === $(`#criteria-${j}-id`).val()) {
                $(`#criteria-${i}-id`).css("border", "2px solid red");
                $(`#criteria-${j}-id`).css("border", "2px solid red");
                goodId = false;
            }
        }
    }

    if (allFilled && goodId) {
        $("#criteria-modal").hide();
        for (let i = 1; i <= numCriteria; i++) {
            $(`#criteria-${i}-id`).css("border", "");
            $(`#criteria-${i}-name`).css("border", "");
        }
        let infoAboutCriteria = "";
        infoAboutCriteria += '<div class="infoAboutCriteria" style="margin-bottom: 10px"><span style="font-size: 24px">Критерии</span></div>';
        for (let i = 1; i < numCriteria; i++) {
            let id = document.getElementById(`criteria-${i}-id`).value;
            let name = document.getElementById(`criteria-${i}-name`).value;
            let isQuality = document.getElementById(`criteria-${i}-qualitative`);
            isQuality = isQuality.options[isQuality.selectedIndex].value;
            /*
            Здесь еще обработка шкал для каждого критерия
             */
            infoAboutCriteria += `<div class="infoAboutCriteria" style="margin-bottom: 5px"><span class="bold-text">Критерий ${i}:  ID: ${id};  Имя: ${name}; Качественная шкала: ${isQuality}</span></div>`;
        }
        let id = document.getElementById(`criteria-${numCriteria}-id`).value;
        let name = document.getElementById(`criteria-${numCriteria}-name`).value;
        let isQuality = document.getElementById(`criteria-${numCriteria}-qualitative`);
            isQuality = isQuality.options[isQuality.selectedIndex].value;
        infoAboutCriteria += `<div class="infoAboutCriteria"><span class="bold-text">Критерий ${numCriteria}:  ID: ${id};  Имя: ${name}; Качественная шкала: ${isQuality}</span></div>`;
        $("#criteria").html(infoAboutCriteria).show();
        $("#warningCriteria").hide();
        $("#number-alternatives-modal").show();
    } else {
        if (!goodId && !allFilled) {
            document.getElementById("Criteria-warning-text").textContent = "Неверный ввод (совпадают id или заполнены не все поля)"
        } else if (!goodId) {
            document.getElementById("Criteria-warning-text").textContent = "Id критериев совпадают"
        } else {
            document.getElementById("Criteria-warning-text").textContent = "Не все поля заполнены"
        }

        $("#warningCriteria").show()
    }
});


$("#back-btn-to-number-of-criteria").click(function () {
    $("#criteria-modal").hide();
    /*
    let blocks = document.querySelectorAll(".criteria-block")
    blocks.forEach(block => block.remove())
    let block = document.querySelector("#criteria");
    block.innerHTML = "";
     */
    $("#number-of-criteria-modal").show();
})

$("#submit-btn-to-evaluate").click(function () {
    let allFilled = true
    for (let i = 1; i <= numAlternative; i++) {
        if ($(`#alternative-${i}-id`).val() === "") {
            $(`#alternative-${i}-id`).css("border", "2px solid red");
            allFilled = false
        }
        if ($(`#alternative-${i}-name`).val() === "") {
            $(`#alternative-${i}-name`).css("border", "2px solid red");
            allFilled = false
        }
    }
    let goodId = true;
    for (let i = 1; i < numAlternative; i++) {
        for (let j = i + 1; j <= numAlternative; j++) {
            if ($(`#alternative-${i}-id`).val() === $(`#alternative-${j}-id`).val()) {
                $(`#alternative-${i}-id`).css("border", "2px solid red");
                $(`#alternative-${j}-id`).css("border", "2px solid red");
                goodId = false;
            }
        }
    }

    if (allFilled && goodId) {
        for (let i = 1; i <= numAlternative; i++) {
            $(`#alternative-${i}-id`).css("border", "");
            $(`#alternative-${i}-name`).css("border", "");
        }
        let infoAboutAlternative = "";
        infoAboutAlternative += '<div class="infoAboutAlternative" style="margin-bottom: 10px"><span style="font-size: 24px">Альтернативы</span></div>';
        for (let i = 1; i < numAlternative; i++) {
            let id = document.getElementById(`alternative-${i}-id`).value;
            let name = document.getElementById(`alternative-${i}-name`).value;
            /*
            Здесь еще обработка шкал для каждого критерия
             */
            infoAboutAlternative += `<div class="infoAboutAlternative" style="margin-bottom: 5px"><span class="bold-text">Альтернатива ${i}:  ID: ${id};  Имя: ${name}</span></div>`;
        }
        let id = document.getElementById(`alternative-${numAlternative}-id`).value;
        let name = document.getElementById(`alternative-${numAlternative}-name`).value;
        infoAboutAlternative += `<div class="infoAboutAlternative"><span class="bold-text">Альтернатива ${numAlternative}:  ID: ${id};  Имя: ${name}</span></div>`;
        $("#alternatives").html(infoAboutAlternative).show();

        $("#alternatives-modal").hide();

        /*
        */
        getSelectedCriteriaLimits().then(arr => {
            let evaluationMatrix = "";
            for (let i = 1; i <= numExperts; i++) {
                evaluationMatrix += `<div class="evaluations-block" id="evaluations-of-experts-${i}" style="margin-bottom: 20px; box-sizing: border-box"><strong>Эксперт ${i}</strong>`;
                evaluationMatrix += `<div style="display: flex; padding-bottom: 5px"><div style="min-width: 120px"></div>`;
                for (let j = 1; j < numCriteria; j++) {
                    evaluationMatrix += `<div style="min-width: 138px; text-align: center; margin-right: 3px"><span>Критерий ${j}</span></div>`;
                }
                evaluationMatrix += `<div style="min-width: 138px; text-align: center"><span>Критерий ${numCriteria}</span></div>`;
                evaluationMatrix += `</div>`;
                for (let j = 1; j <= numAlternative; j++) {
                    evaluationMatrix += `<div style="display: flex; margin-bottom: 3px"><span style="min-width: 120px; padding-top: 10px">Альтернатива ${j}</span>`
                    for (let k = 1; k <= numCriteria; k++) {
                        let getIsQuality = document.getElementById(`criteria-${k}-qualitative`);
                        let isQuantity = getIsQuality.options[getIsQuality.selectedIndex].value === "false";
                        if (isQuantity) {
                            let limit = arr[k]
                            if (k !== numCriteria) {
                                evaluationMatrix += `<div style="margin-right: 3px"><input type="number" value="0" id="assessment-${i}-${j}-${k}" name="assessment-${i}-${j}-${k}" max="${limit}" style="max-width: 138px; min-height: 38px; box-sizing: border-box"></div>`;
                            } else {
                                evaluationMatrix += `<div><input type="number" value="0" id="assessment-${i}-${j}-${k}" name="assessment-${i}-${j}-${k}" max="${limit}" style="max-width: 138px; min-height: 38px; box-sizing: border-box"></div>`;
                            }
                        } else {
                            evaluationMatrix += `<div><select id="assessment-${i}-${j}-${k}" name="assessment-${i}-${j}-${k}" style="max-width: 138px">`;
                            let selectedScale = $(`#criteria-${k}-scale-select`).val();
                            if (selectedScale && selectedScale.startsWith('S')) {
                                let scaleValues = qualitativeScaleValues[selectedScale];

                                if (scaleValues) {
                                    scaleValues.split(', ').forEach(value => {
                                        evaluationMatrix += `<option value="${value.trim()}">${value.trim()}</option>`;
                                    });
                                }
                            }
                            evaluationMatrix += `</select></div>`;
                        }
                    }
                    evaluationMatrix += `</div>`;
                }
                evaluationMatrix += `</div>`;
            }
            $("#evaluations-fields").html(evaluationMatrix);
            $("#evaluation-modal").show();
        })
    } else {
        if (!goodId && !allFilled) {
            document.getElementById("Alternative-warning-text").textContent = "Неверный ввод (совпадают id или заполнены не все поля)"
        } else if (!goodId) {
            document.getElementById("Alternative-warning-text").textContent = "Id критериев совпадают"
        } else {
            document.getElementById("Alternative-warning-text").textContent = "Не все поля заполнены"
        }
        $("#warningCriteria").show()
    }
})

/*

 */
$("#back-btn-to-fields-of-alternatives").click(function () {
    $("#evaluation-modal").hide();



    $("#alternatives-modal").show();
})

$("#submit-btn-to-send").click(function () {
    /*
        Главный блок
     */
    let index = 1;
    for (let key in scalesFromOntology) {
        data.scales.push({
            scaleID: "S" + index,
            scaleName: key,
            labels: scalesFromOntology[key]
        });
        index++;
    }
    data.scales.push({
        scaleID: "Res",
        scaleName: "ResScale",
        labels: [
        "очень низкий",
        "низкий",
        "ниже среднего",
        "средний",
        "выше среднего",
        "высокий",
        "очень высокий"
      ]
    });

    for (let i = 1; i <= numExperts; i++) {
        let expertName = $(`#expert-${i}-name`).val();
        let expertId = $(`#expert-${i}-id`).val();
        let expertCompetence = $(`#expert-${i}-competence`).val().split(", ");
        data.experts.push({"expertName": expertName, "expertID": expertId, "competencies": expertCompetence});
        data.estimations[expertId] = [];
    }
    for (let i = 1; i <= numAlternative; i++) {
        let alternativeName = $(`#alternative-${i}-name`).val();
        let alternativeId = $(`#alternative-${i}-id`).val();
        data.alternatives.push({"alternativeID": alternativeId, "alternativeName": alternativeName, "abstractionLevelID": "group1"});
    }
    for (let i = 1; i <= numCriteria; i++) {
        let criteriaName = $(`#criteria-${i}-name`).val();
        let criteriaId = $(`#criteria-${i}-id`).val();
        data.criteria.group1.push({"criteriaID": criteriaId, "criteriaName": criteriaName, "qualitative": $(`#criteria-${i}-qualitative`).val() === "true"})
    }
    let arrayOfExpertsWeights = Array(numExperts).fill((1/numExperts));
    for (let i = 1; i <= numExperts; i++) {
        data.expertWeights[$(`#expert-${i}-id`).val()] = arrayOfExpertsWeights[i-1];
    }
    for (let i = 1; i <= numExperts; i++) {
        let expertID = $(`#expert-${i}-id`).val();
        for (let j = 1; j <= numAlternative; j++) {
            let alternativeID = $(`#alternative-${j}-id`).val();
            let criteria2Estimation = [];
            for (let k = 1; k <= numCriteria; k++) {
                let criteriaID = $(`#criteria-${k}-id`).val();
                let estimationData = {
                    criteriaID: criteriaID,
                    estimation: [$(`#assessment-${i}-${j}-${k}`).val()]
                };
                let isQualitative = $(`#criteria-${k}-qualitative`).val() === 'true';
                if (isQualitative) {
                    let selectedScale = $(`#criteria-${k}-scale-select`).val();
                    if (selectedScale) {
                        estimationData['scaleID'] = selectedScale;
                    }
                }
                criteria2Estimation.push(estimationData);
            }
            data.estimations[expertID].push({
                alternativeID: alternativeID,
                criteria2Estimation: criteria2Estimation
            });
        }
    }
    let jsonString = JSON.stringify(data, null, 2);
    $.ajax({
        type: "POST",
        url: "/get_file",
        contentType: "application/json",
        data: jsonString,
        success: function() {
            waitForFile();
        },
        error: function (error) {
            console.log("Ошибка:", error);
        }
    });
    function checkFileExists() {
        return $.ajax({
            url: "/check_file", // API на сервере, возвращающее статус файла
            method: "GET",
            dataType: "json"
        });
    }

    // Функция polling
    function waitForFile() {
        const interval = 1000; // проверка раз в секунду
        const maxAttempts = 30; // максимум попыток (например, 30 секунд)
        let attempts = 0;

        const poll = () => {
            checkFileExists().done(function(data) {
                if (data.exists) {
                    // Файл есть — вызываем второй AJAX
                    loadAndDisplayResults();
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        console.log("Файл не появился за отведенное время");
                    }
                }
            }).fail(function() {
                console.log("Ошибка проверки наличия файла");
            });
        };

        poll();
    }
    function loadAndDisplayResults() {
        $.ajax({
            url: "/send_json_to_js",
            method: "GET",
            dataType: "json",
            success: function (data) {
                console.log(data);
                let result = data;
                let estimations = data.alternativesOrdered;
                let resFields = "";
                for (let i = 0; i < numAlternative; i++) {
                    resFields += `<div class="res-block"><span>Альтернатива: ${estimations[i].alternativeID}`;
                    for (const [key, value] of Object.entries(estimations[i].estimation[0])) {
                        resFields += ` Оценка: ${value} ${key}</span></div>`;
                    }
                }
                $("#evaluation-modal").hide();
                $("#result-fields").html(resFields);
                $("#meaningful-modal").hide();
                $("#result-modal").show();
                $("#result-left-modal").show();
            },
            error: function (error) {
                console.log("Ошибка при получении данных:", error);
            }
        });
    }
})

$("#submit-btn-to-add-new-alternative").click(function () {
    $("#result-left-modal").hide();
    $("#add-alternative-modal").show();
    let newAlternativeField = "";
    newAlternativeField += `<div class="alternative-block" id="alternative-block-${numAlternative+1}" style="margin-bottom: 10px"><span class="bold-text" style="padding-bottom: 5px">Альтернатива ${numAlternative + 1}:</span>`;
    newAlternativeField += `<div class="row_alternatives"><label for="alternative-${numAlternative+1}-id" style="padding-top: 6px">ID:</label> <input type="text" id="alternative-${numAlternative + 1}-id" name="alternative-${numAlternative + 1}-id" required></div>`;
    newAlternativeField += `<div class="row_alternatives"><label for="alternative-${numAlternative+1}-name" style="padding-top: 6px">Название:</label> <input type="text" id="alternative-${numAlternative+1}-name" name="alternative-${numAlternative+1}-name" required><br></div></div>`;
    numAlternative = numAlternative + 1;
    for (let i = 1; i <= numExperts; i++) {
        newAlternativeField += `<div class="extra-evaluation-block"><strong>Эксперт ${i}</strong>`
        newAlternativeField += `<div style="display: flex"></div><div style="display: flex; padding-bottom: 5px"><div style="min-width: 120px"></div>`;
        for (let j = 1; j < numCriteria; j++) {
            newAlternativeField += `<div style="min-width: 138px; text-align: center; margin-right: 3px"><span>Критерий ${j}</span></div>`;
        }
        newAlternativeField += `<div style="min-width: 138px; text-align: center; margin-right: 3px"><span>Критерий ${numCriteria}</span></div></div>`;
        newAlternativeField += `<div style="display: flex; margin-bottom: 3px"><span style="min-width: 120px; padding-top: 10px">Альтернатива ${numAlternative}</span>`
        for (let k = 1; k <= numCriteria; k++) {
            let getIsQuality = document.getElementById(`criteria-${k}-qualitative`);
            let isQuantity = getIsQuality.options[getIsQuality.selectedIndex].value === "false";
            if (isQuantity) {
                let limit = limits[k]
                if (k !== numCriteria) {
                    newAlternativeField += `<div style="margin-right: 3px"><input type="number" value="0" id="assessment-${i}-${numAlternative}-${k}" name="assessment-${i}-${numAlternative}-${k}" max="${limit}" style="max-width: 138px; min-height: 38px; box-sizing: border-box"></div>`;
                } else {
                    newAlternativeField += `<div><input type="number" value="0" id="assessment-${i}-${numAlternative}-${k}" name="assessment-${i}-${numAlternative}-${k}" max="${limit}" style="max-width: 138px; min-height: 38px; box-sizing: border-box"></div>`;
                }
            } else {
                newAlternativeField += `<div><select id="assessment-${i}-${numAlternative}-${k}" name="assessment-${i}-${numAlternative}-${k}" style="max-width: 138px">`;
                let selectedScale = $(`#criteria-${k}-scale-select`).val();
                if (selectedScale && selectedScale.startsWith('S')) {
                    let scaleValues = qualitativeScaleValues[selectedScale];
                    if (scaleValues) {
                        scaleValues.split(', ').forEach(value => {
                            newAlternativeField += `<option value="${value.trim()}">${value.trim()}</option>`;
                        });
                    }
                }
                newAlternativeField += `</select></div>`;
            }
        }
        newAlternativeField += `</div>`;
    }
    newAlternativeField += `</div>`;
    $("#new-alternative-fields").html(newAlternativeField);
})

$("#submit-btn-to-send-new-alternative").click(function () {
    function deleteFile() {
        return $.ajax({
            url: "/cleanup", // API на сервере, возвращающее статус файла
            method: "POST",
            dataType: "json"
        });
    }
    deleteFile().done(function(response) {
        console.log("Ответ сервера:", response);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Ошибка при вызове cleanup:", textStatus);
    });
    let alternativeName = $(`#alternative-${numAlternative}-name`).val();
    let alternativeId = $(`#alternative-${numAlternative}-id`).val();
    data.alternatives.push({"alternativeID": alternativeId, "alternativeName": alternativeName, "abstractionLevelID": "group1"})
    for (let i = 1; i <= numExperts; i++) {
        let expertID = $(`#expert-${i}-id`).val();
        let criteria2Estimation = [];
        for (let k = 1; k <= numCriteria; k++) {
            let criteriaID = $(`#criteria-${k}-id`).val();
            let estimationData = {
                criteriaID: criteriaID,
                estimation: [$(`#assessment-${i}-${numAlternative}-${k}`).val()]
            };
            let isQualitative = $(`#criteria-${k}-qualitative`).val() === 'true';
            if (isQualitative) {
                let selectedScale = $(`#criteria-${k}-scale-select`).val();
                if (selectedScale) {
                    estimationData['scaleID'] = selectedScale;
                }
            }
            criteria2Estimation.push(estimationData);
        }
        data.estimations[expertID].push({
            alternativeID: alternativeId,
            criteria2Estimation: criteria2Estimation
        });
    }
    let jsonString = JSON.stringify(data, null, 2);
    $.ajax({
        type: "POST",
        url: "/get_file",
        contentType: "application/json",
        data: jsonString,
        success: function() {
            waitForFile();
        },
        error: function (error) {
            console.log("Ошибка:", error);
        }
    });
    function checkFileExists() {
        return $.ajax({
            url: "/check_file", // API на сервере, возвращающее статус файла
            method: "GET",
            dataType: "json"
        });
    }

    // Функция polling
    function waitForFile() {
        const interval = 1000; // проверка раз в секунду
        const maxAttempts = 30; // максимум попыток (например, 30 секунд)
        let attempts = 0;

        const poll = () => {
            checkFileExists().done(function(data) {
                if (data.exists) {
                    // Файл есть — вызываем второй AJAX
                    loadAndDisplayResults();
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        console.log("Файл не появился за отведенное время");
                    }
                }
            }).fail(function() {
                console.log("Ошибка проверки наличия файла");
            });
        };

        poll();
    }
    function loadAndDisplayResults() {
        $.ajax({
            url: "/send_json_to_js",
            method: "GET",
            dataType: "json",
            success: function (data) {
                console.log(data);
                let estimations = data.alternativesOrdered;
                let resFields = "";
                for (let i = 0; i < numAlternative; i++) {
                    resFields += `<div class="res-block"><span>Альтернатива: ${estimations[i].alternativeID}`;
                    for (const [key, value] of Object.entries(estimations[i].estimation[0])) {
                        resFields += ` Оценка: ${value} ${key}</span></div>`;
                    }
                }
                $("#add-alternative-modal").hide();
                $("#evaluation-modal").hide();
                $("#result-fields").html(resFields);
                $("#meaningful-modal").hide();
                $("#result-modal").show();
                $("#result-left-modal").show();
            },
            error: function (error) {
                console.log("Ошибка при получении данных:", error);
            }
        });
    }
})







