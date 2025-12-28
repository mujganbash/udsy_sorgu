const form = document.getElementById('survey-form');
const q4Input = document.querySelector('input[name="q4"]');
const q5Group = document.getElementById('q5-group');

// Show Q5 only if Q4 = Bəli
document.querySelectorAll('input[name="q4"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            q5Group.style.display = 'flex';
            document.querySelector('input[name="q5"]').required = true;
        } else {
            q5Group.style.display = 'none';
            document.querySelector('input[name="q5"]').required = false;
            document.querySelectorAll('input[name="q5"]').forEach(r => r.checked = false);
        }
    });
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    evaluateEligibility();
});

function evaluateEligibility() {
    const answers = {
        familySize: parseInt(document.getElementById('q1').value),
        unemployed: document.querySelector('input[name="q2"]:checked').value === 'yes',
        childUnder8: document.querySelector('input[name="q3"]:checked').value === 'yes',
        rented: document.querySelector('input[name="q4"]:checked').value === 'yes',
        rentContract: document.querySelector('input[name="q5"]:checked')?.value === 'yes',
        income: parseInt(document.getElementById('q6').value),
        vehicle: document.querySelector('input[name="q7"]:checked').value === 'yes',
        multipleProperties: document.querySelector('input[name="q8"]:checked').value === 'yes',
        largeTransactions: document.querySelector('input[name="q9"]:checked').value === 'yes',
        utilities: parseInt(document.getElementById('q10').value),
        registryMatch: document.querySelector('input[name="q11"]:checked').value === 'yes'
    };

    const result = determineEligibility(answers);
    displayResult(result);
}

function determineEligibility(answers) {
    // Calculate per capita values
    const incomePerCapita = (answers.income / 12) / answers.familySize;
    const utilitiesPerCapita = answers.utilities / answers.familySize;

    // Rejection conditions
    const rejectionReasons = [];

    // Q2 + Q3 logic - add reason if unemployed and no child under 8
    if (answers.unemployed && !answers.childUnder8) {
        rejectionReasons.push('unemployed');
    }

    // Q5 check - add reason if rented but no notarized contract
    if (answers.rented && !answers.rentContract) {
        rejectionReasons.push('rent');
    }

    // Income check
    if (incomePerCapita > 285) {
        rejectionReasons.push('income');
    }

    // Vehicle check
    if (answers.vehicle) {
        rejectionReasons.push('vehicle');
    }

    // Multiple properties check
    if (answers.multipleProperties) {
        rejectionReasons.push('properties');
    }

    // Large transactions check
    if (answers.largeTransactions) {
        rejectionReasons.push('transactions');
    }

    // Utilities check
    if (utilitiesPerCapita >= 42.75) {
        rejectionReasons.push('utilities');
    }

    // If any rejection reasons, return rejection
    if (rejectionReasons.length > 0) {
        return {
            status: 'Hüquq yoxdur',
            message: 'Qeyd etdiyiniz məlumatlara əsasən, ÜDSY almaq hüququnuz yoxdur',
            reasons: rejectionReasons
        };
    }

    // Q11 check: registry mismatch
    if (!answers.registryMatch) {
        return {
            status: 'Hüquq yoxdur',
            message: 'Qeyd etdiyiniz məlumatlara əsasən, ÜDSY almaq hüququnuz yoxdur'
        };
    }

    // Count positive conditions for probability calculation
    let positiveConditions = 0;

    // Income ≤ 285 per capita is positive
    if (incomePerCapita <= 285) {
        positiveConditions++;
    }

    // No vehicle is positive
    if (!answers.vehicle) {
        positiveConditions++;
    }

    // No multiple properties is positive
    if (!answers.multipleProperties) {
        positiveConditions++;
    }

    // No large transactions is positive
    if (!answers.largeTransactions) {
        positiveConditions++;
    }

    // Utilities < 42.75 is positive
    if (utilitiesPerCapita < 42.75) {
        positiveConditions++;
    }

    // Child under 8 adds to chance
    if (answers.childUnder8) {
        positiveConditions++;
    }

    // If unemployed but has child under 8
    if (answers.unemployed && answers.childUnder8) {
        // This is a special case, probability is 60%
        return {
            status: 'Hüquq var',
            probability: 60,
            message: 'Sizin ÜDSY almaq hüququnuz ola bilər (60%)',
            hasLink: true
        };
    }

    // Calculate probability: P = 1 - (0.4)^n
    const probability = Math.round((1 - Math.pow(0.4, positiveConditions)) * 100);

    // Determine output based on probability
    if (probability === 100) {
        return {
            status: 'Hüquq var',
            message: 'Sizin ÜDSY almaq hüququnuz var. Rəsmi müraciət edin',
            hasLink: true
        };
    } else {
        return {
            status: 'Hüquq var',
            probability: probability,
            message: `Sizin ÜDSY almaq hüququnuz ola bilər (${probability}%)`,
            hasLink: true
        };
    }
}

function displayResult(result) {
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'flex';

    let displayMessage = '';

    if (result.status === 'Hüquq yoxdur') {
        displayMessage = '<strong style="font-size: 18px;">Qeyd etdiyiniz məlumatlara əsasən, sizin ÜDSY almaq hüququnuz yoxdur</strong>\n\n';

        if (result.reasons && result.reasons.length > 0) {
            result.reasons.forEach(reason => {
                switch(reason) {
                    case 'unemployed':
                        displayMessage += '• Ailənizdə əmək qabiliyyətli olub işləməyən şəxs olduğu üçün\n';
                        break;
                    case 'rent':
                        displayMessage += '• Kirayə müqaviləniz notarial təsdiq olmadığı üçün\n';
                        break;
                    case 'income':
                        displayMessage += '• Ailənizin son 12 ayda adambaşı orta aylıq gəliri, ehtiyac meyarını aşdığı üçün\n';
                        break;
                    case 'vehicle':
                        displayMessage += '• Nəqliyyat vasitəniz olduğu üçün\n';
                        break;
                    case 'properties':
                        displayMessage += '• 2 və daha çox eyni təyinatlı daşınmaz əmlakınız olduğu üçün\n';
                        break;
                    case 'transactions':
                        displayMessage += '• Son 12 ayda 12×285 (minimum əmək haqqı)-dan daha çox alqı-satqınız olduğu üçün\n';
                        break;
                    case 'utilities':
                        displayMessage += '• Adambaşına düşən orta aylıq kommunal xərcləriniz ehtiyac limitindən artıq olduğu üçün\n';
                        break;
                }
            });
        }

        // Qanunlara yönəldən link əlavə et
        displayMessage += '\n\n<a href="laws.html" target="_blank" style="color: #2563eb; text-decoration: none;">ÜDSY haqqında qanuna baxın →</a>';
    } else {
        displayMessage = result.message;
    }

    document.getElementById('result-text').innerHTML = displayMessage;

    // Show link if has right (both "Ola bilər" and "Hüquq var" cases)
    const linkElement = document.getElementById('gov-link');
    if (result.hasLink) {
        linkElement.style.display = 'block';
    } else {
        linkElement.style.display = 'none';
    }
}


