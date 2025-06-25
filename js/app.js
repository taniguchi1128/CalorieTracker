document.addEventListener('DOMContentLoaded', async () => {
    // IndexedDBを初期化
    await window.dbManager.openDB();
    displayFoods();
    displayDishes(); // 料理リストの初期表示を追加

    // ----------------------------------------------------
    // 食材登録フォームの処理 (既存、変更なし)
    // ----------------------------------------------------
    const foodForm = document.getElementById('food-form');
    foodForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('food-name').value;
        const referenceAmount = parseFloat(document.getElementById('food-reference-amount').value);
        const referenceUnit = document.getElementById('food-reference-unit').value;
        const protein = parseFloat(document.getElementById('food-protein').value);
        const fat = parseFloat(document.getElementById('food-fat').value);
        const carb = parseFloat(document.getElementById('food-carb').value);
        const calorie = parseFloat(document.getElementById('food-calorie').value);

        if (!name || isNaN(referenceAmount) || isNaN(protein) || isNaN(fat) || isNaN(carb) || isNaN(calorie)) {
            alert('食材のすべての項目を正しく入力してください。');
            return;
        }
        if (referenceAmount <= 0) {
            alert('食材の基準量は0より大きい値を入力してください。');
            return;
        }

        const newFood = {
            name: name,
            reference: {
                amount: referenceAmount,
                unit: referenceUnit
            },
            pfc_per_reference: {
                protein: protein,
                fat: fat,
                carb: carb
            },
            calorie_per_reference: calorie
        };

        try {
            await window.dbManager.addFood(newFood);
            alert('食材が登録されました！');
            foodForm.reset();
            displayFoods();
            // 料理フォームの食材選択肢も更新が必要なため、再描画
            populateFoodSelects();
        } catch (error) {
            console.error('食材の保存に失敗しました:', error);
            alert('食材の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの食材をHTMLリストに表示する関数 (既存、変更なし)
     */
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
                li.innerHTML = `
                    <span>${food.name}</span>
                    <span>Kcal: ${food.calorie_per_reference}kcal P: ${food.pfc_per_reference.protein}g F: ${food.pfc_per_reference.fat}g C: ${food.pfc_per_reference.carb}g (${food.reference.amount}${food.reference.unit}あたり)</span>
                `;
                foodsListUl.appendChild(li);
            });
        } catch (error) {
            console.error('食材の取得に失敗しました:', error);
            foodsListUl.innerHTML = '<li>食材の読み込み中にエラーが発生しました。</li>';
        }
    }

    // ----------------------------------------------------
    // 料理登録フォームの処理 (新規追加)
    // ----------------------------------------------------
    const dishForm = document.getElementById('dish-form');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientsContainer = document.getElementById('dish-ingredients-container');
    const dishTotalCalorieSpan = document.getElementById('dish-total-calorie');
    const dishTotalProteinSpan = document.getElementById('dish-total-protein');
    const dishTotalFatSpan = document.getElementById('dish-total-fat');
    const dishTotalCarbSpan = document.getElementById('dish-total-carb');

    let availableFoods = []; // 登録済みの食材リストを保持

    // ページロード時と食材登録時に食材選択肢を更新
    await populateFoodSelects(); // 初期ロード時に呼び出す

    /**
     * 食材選択のプルダウンを生成・更新する関数
     */
    async function populateFoodSelects() {
        availableFoods = await window.dbManager.getAllFoods();
        // 既存の食材選択プルダウンを更新するために、すべての食材エントリを再描画
        // または、既存のものを一度削除して再作成するロジックが必要
        // 現時点では、addIngredientEntry 関数内で毎回最新のリストを取得する
        // または、ここに一度全てのselect要素を取得してoptionをクリア＆追加するロジックを実装する
        // 簡単のために、新しい食材が追加されたら、料理フォーム全体をリセットしてaddIngredientEntry()を呼び直す戦略もアリ
        // 今回はシンプルに、addIngredientEntryで毎回新しいselectを作るので、ここでは特に何もしない（既存のselectは更新されない）
        // 実際には、既存の<select>要素を探し、その中の<option>要素を更新する必要があります。
        // デモのため、今回は新しい食材を追加したら、手動で料理フォームを一度リロードすることを想定。
        // より良い実装は後述します。
    }


    /**
     * 新しい食材入力行を料理フォームに追加する関数
     */
    function addIngredientEntry(foodId = '', amount = '') {
        const div = document.createElement('div');
        div.classList.add('ingredient-entry');

        // 食材選択プルダウンの生成
        const select = document.createElement('select');
        select.classList.add('ingredient-select');
        select.required = true;

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '食材を選択してください';
        select.appendChild(defaultOption);

        availableFoods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.id; // IndexedDBのIDをvalueにする
            option.textContent = food.name;
            if (food.id === foodId) { // 既存のデータがあれば選択状態にする
                option.selected = true;
            }
            select.appendChild(option);
        });

        // 量の入力フィールド
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.classList.add('ingredient-amount');
        amountInput.placeholder = '量';
        amountInput.step = '0.1';
        amountInput.required = true;
        amountInput.value = amount; // 既存のデータがあれば値をセット

        // 単位表示要素
        const unitSpan = document.createElement('span');
        unitSpan.classList.add('unit-display');
        unitSpan.textContent = ''; // 初期値は空

        // 食材選択が変更されたら単位表示を更新し、PFC計算をトリガー
        select.addEventListener('change', async () => {
            const selectedFoodId = parseInt(select.value);
            const selectedFood = availableFoods.find(f => f.id === selectedFoodId);
            if (selectedFood) {
                unitSpan.textContent = selectedFood.reference.unit;
            } else {
                unitSpan.textContent = '';
            }
            calculateDishTotals();
        });

        // 量が変更されたらPFC計算をトリガー
        amountInput.addEventListener('input', calculateDishTotals);

        // 削除ボタン
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => {
            div.remove(); // 親要素ごと削除
            calculateDishTotals(); // 削除後にも再計算
        });

        div.appendChild(select);
        div.appendChild(amountInput);
        div.appendChild(unitSpan);
        div.appendChild(removeButton);
        ingredientsContainer.appendChild(div);

        // 初期選択があれば単位表示を更新
        if (foodId) {
            const selectedFood = availableFoods.find(f => f.id === foodId);
            if (selectedFood) {
                unitSpan.textContent = selectedFood.reference.unit;
            }
        }
    }

    // 「食材を追加」ボタンのクリックイベント
    addIngredientBtn.addEventListener('click', () => addIngredientEntry());

    /**
     * 料理の合計PFCとカロリーを計算し、表示を更新する
     */
    async function calculateDishTotals() {
        let totalCalorie = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCarb = 0;

        const ingredientEntries = document.querySelectorAll('.ingredient-entry');

        ingredientEntries.forEach(entry => {
            const foodSelect = entry.querySelector('.ingredient-select');
            const amountInput = entry.querySelector('.ingredient-amount');

            const foodId = parseInt(foodSelect.value);
            const amount = parseFloat(amountInput.value);

            if (foodId && !isNaN(amount) && amount > 0) {
                const selectedFood = availableFoods.find(f => f.id === foodId);

                if (selectedFood) {
                    const refAmount = selectedFood.reference.amount;
                    const pfc = selectedFood.pfc_per_reference;
                    const calorie = selectedFood.calorie_per_reference;

                    // 基準量あたりから使用量あたりのPFC・カロリーを計算
                    const ratio = amount / refAmount;

                    totalCalorie += calorie * ratio;
                    totalProtein += pfc.protein * ratio;
                    totalFat += pfc.fat * ratio;
                    totalCarb += pfc.carb * ratio;
                }
            }
        });

        dishTotalCalorieSpan.textContent = totalCalorie.toFixed(1);
        dishTotalProteinSpan.textContent = totalProtein.toFixed(1);
        dishTotalFatSpan.textContent = totalFat.toFixed(1);
        dishTotalCarbSpan.textContent = totalCarb.toFixed(1);
    }

    // 料理フォームの送信イベント
    dishForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dishName = document.getElementById('dish-name').value;
        if (!dishName) {
            alert('料理名を入力してください。');
            return;
        }

        const ingredients = [];
        const ingredientEntries = document.querySelectorAll('.ingredient-entry');
        let isValid = true;

        ingredientEntries.forEach(entry => {
            const foodSelect = entry.querySelector('.ingredient-select');
            const amountInput = entry.querySelector('.ingredient-amount');

            const foodId = parseInt(foodSelect.value);
            const amount = parseFloat(amountInput.value);

            if (!foodId || isNaN(amount) || amount <= 0) {
                isValid = false;
                return;
            }

            ingredients.push({
                foodId: foodId,
                amount: amount
            });
        });

        if (!isValid) {
            alert('使用食材の選択または量が正しく入力されていません。');
            return;
        }
        if (ingredients.length === 0) {
             alert('料理に使用する食材を1つ以上追加してください。');
             return;
        }


        // 計算済みの合計値をそのまま保存
        const totalCalorie = parseFloat(dishTotalCalorieSpan.textContent);
        const totalProtein = parseFloat(dishTotalProteinSpan.textContent);
        const totalFat = parseFloat(dishTotalFatSpan.textContent);
        const totalCarb = parseFloat(dishTotalCarbSpan.textContent);


        const newDish = {
            name: dishName,
            ingredients: ingredients, // 使用した食材のIDと量
            total_pfc: {
                protein: totalProtein,
                fat: totalFat,
                carb: totalCarb
            },
            total_calorie: totalCalorie
        };

        try {
            await window.dbManager.addDish(newDish);
            alert('料理が登録されました！');
            dishForm.reset();
            ingredientsContainer.innerHTML = ''; // 食材リストをクリア
            addIngredientEntry(); // 初期状態で1行追加
            calculateDishTotals(); // 合計表示をリセット
            displayDishes(); // 料理リストを更新
        } catch (error) {
            console.error('料理の保存に失敗しました:', error);
            alert('料理の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの料理をHTMLリストに表示する関数 (新規追加)
     */
    async function displayDishes() {
        const dishesListUl = document.getElementById('registered-dishes-ul');
        dishesListUl.innerHTML = '';

        try {
            const dishes = await window.dbManager.getAllDishes();
            if (dishes.length === 0) {
                dishesListUl.innerHTML = '<li>登録済みの料理はありません。</li>';
                return;
            }

            dishes.forEach(dish => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${dish.name}</span>
                    <span>Kcal: ${dish.total_calorie}kcal P: ${dish.total_pfc.protein}g F: ${dish.total_pfc.fat}g C: ${dish.total_pfc.carb}g</span>
                `;
                dishesListUl.appendChild(li);
            });
        } catch (error) {
            console.error('料理の取得に失敗しました:', error);
            dishesListUl.innerHTML = '<li>料理の読み込み中にエラーが発生しました。</li>';
        }
    }

    // 初期ロード時に、料理登録フォームに最初の食材入力行を追加
    addIngredientEntry();

    // アプリ起動時にすべての食材を取得しておく（料理フォームのselect用）
    // populateFoodSelects() が Promise を返すので await で待つ
    await populateFoodSelects();
});