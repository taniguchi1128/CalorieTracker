document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.openDB();
    displayFoods();

    const foodForm = document.getElementById('food-form');
    foodForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('food-name').value;
        // 新しく追加した基準量と単位の取得
        const referenceAmount = parseFloat(document.getElementById('food-reference-amount').value);
        const referenceUnit = document.getElementById('food-reference-unit').value;

        const protein = parseFloat(document.getElementById('food-protein').value);
        const fat = parseFloat(document.getElementById('food-fat').value);
        const carb = parseFloat(document.getElementById('food-carb').value);

        if (!name || isNaN(referenceAmount) || isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('すべての項目を正しく入力してください。');
            return;
        }
        if (referenceAmount <= 0) {
            alert('基準量は0より大きい値を入力してください。');
            return;
        }

        const newFood = {
            name: name,
            // 新しいデータ構造：基準量と単位を含む
            reference: {
                amount: referenceAmount,
                unit: referenceUnit
            },
            pfc_per_reference: { // 名称も変更して分かりやすく
                protein: protein,
                fat: fat,
                carb: carb
            }
        };

        try {
            await window.dbManager.addFood(newFood);
            alert('食材が登録されました！');
            foodForm.reset();
            displayFoods();
        } catch (error) {
            console.error('食材の保存に失敗しました:', error);
            alert('食材の保存中にエラーが発生しました。');
        }
    });

    async function displayFoods() {
        const foodsListUl = document.getElementById('registered-foods-ul');
        foodsListUl.innerHTML = '';

        try {
            const foods = await window.dbManager.getAllFoods();
            if (foods.length === 0) {
                foodsListUl.innerHTML = '<li>登録済みの食材はありません。</li>';
                return;
            }

            foods.forEach(food => {
                const li = document.createElement('li');
                // 表示も新しいデータ構造に合わせて変更
                li.innerHTML = `
                    <span>${food.name}</span>
                    <span>P: ${food.pfc_per_reference.protein}g F: ${food.pfc_per_reference.fat}g C: ${food.pfc_per_reference.carb}g (${food.reference.amount}${food.reference.unit}あたり)</span>
                `;
                foodsListUl.appendChild(li);
            });
        } catch (error) {
            console.error('食材の取得に失敗しました:', error);
            foodsListUl.innerHTML = '<li>食材の読み込み中にエラーが発生しました。</li>';
        }
    }
});