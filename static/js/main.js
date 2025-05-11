let numExperts = 0;
let numCriteria = 0;
let numAlternative = 0;
let quantitativeLimitsOptions = "";
let formattedQuantitativeLimitsOptions = "";
let qualitativeScaleOptions = "";
let qualitativeScaleValues = {};
let scalesFromOntology = {};
let criteriaLimits = {};

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
    blocks = document.querySelectorAll(".alternative-block-block");
    blocks.forEach(block => block.remove());
    blocks = document.querySelectorAll(".alternative-block-block");
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


    numExperts = 0;
    numCriteria = 0;
    numAlternative = 0;
    $("#main-modal").show();
    $("#experts-modal").hide();
    $("#number-of-criteria-modal").hide()
    $("#alternatives-modal").hide();
    $("#criteria-modal").hide();
    $("#number-alternatives-modal").hide();
})




$(document).ready(function () {
    loadQuantitativeScales();
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
    if (numAlternative !== parseInt($("#alternatives-input").val())) {
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
                criteriaFields += `<div class="row-criterias" id="criteria-${i}-scale" style="display: none;"><label for="criteria-${i}-scale-select" style="padding-top: 6px">Выберите шкалу:</label> <select id="criteria-${i}-scale-select" name="criteria-${i}-scale-select"></select><br></div>`;
                criteriaFields += `<div class="row-criterias" id="criteria-${i}-limit"><label for="criteria-${i}-limit-select" style="padding-top: 10px">Ограничение:</label> <select id="criteria-${i}-limit-select" name="criteria-${i}-limit-select">${quantitativeLimitsOptions}</select><br></div>`;
                criteriaFields += `</div>`;
            }
            $("#criteria-fields").html(criteriaFields);


                /*
                    Здесь еще нужен код для смены количественных критериев на качественные
                 */



        }
    } else {
        $("#number-of-criteria-modal").hide();
        $("#criteria-modal").show();
    }
})

$("#submit-btn-to-number-of-alternatives").click(function () {
    let allFilled = true
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
            /*
            Здесь еще обработка шкал для каждого критерия
             */
            infoAboutCriteria += `<div class="infoAboutCriteria" style="margin-bottom: 5px"><span class="bold-text">Критерий ${i}:  ID: ${id};  Имя: ${name}</span></div>`;
        }
        let id = document.getElementById(`criteria-${numCriteria}-id`).value;
        let name = document.getElementById(`criteria-${numCriteria}-name`).value;
        infoAboutCriteria += `<div class="infoAboutCriteria"><span class="bold-text">Критерий ${numCriteria}:  ID: ${id};  Имя: ${name}</span></div>`;
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
        /*
        Удаление текущего блока
        Появление следующего блока
         */
        /*
            Код для оценки экспертов каждой альтернативы
        */
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








