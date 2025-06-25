document.addEventListener('DOMContentLoaded', async () => {
    await window.dbManager.openDB();
    displayFoods();
    displayDishes();

    // ----------------------------------------------------
    // 食材登録フォームの処理 (既存)
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
            populateFoodSelects(); // 料理フォームの食材選択肢も更新
        } catch (error) {
            console.error('食材の保存に失敗しました:', error);
            alert('食材の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの食材をHTMLリストに表示する関数 (変更あり)
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
                    <button class="delete-btn" data-id="${food.id}" data-type="food">削除</button>
                `;
                foodsListUl.appendChild(li);
            });
            // 削除ボタンのイベントリスナーを設定
            attachDeleteListeners('food');
        } catch (error) {
            console.error('食材の取得に失敗しました:', error);
            foodsListUl.innerHTML = '<li>食材の読み込み中にエラーが発生しました。</li>';
        }
    }

    // ----------------------------------------------------
    // 料理登録フォームの処理 (既存)
    // ----------------------------------------------------
    const dishForm = document.getElementById('dish-form');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientsContainer = document.getElementById('dish-ingredients-container');
    const dishTotalCalorieSpan = document.getElementById('dish-total-calorie');
    const dishTotalProteinSpan = document.getElementById('dish-total-protein');
    const dishTotalFatSpan = document.getElementById('dish-total-fat');
    const dishTotalCarbSpan = document.getElementById('dish-total-carb');

    let availableFoods = [];

    await populateFoodSelects(); // 初期ロード時に呼び出す

    async function populateFoodSelects() {
        availableFoods = await window.dbManager.getAllFoods();
        // ここで既存の食材選択プルダウンを更新する必要がある場合がある
        // 現在は addIngredientEntry が毎回optionを再生成するので、ここでは何もしない
        // もし動的に追加された select も含めて更新したい場合は、
        // document.querySelectorAll('.ingredient-select') で取得してループ処理を行う
    }

    function addIngredientEntry(foodId = '', amount = '') {
        const div = document.createElement('div');
        div.classList.add('ingredient-entry');

        const select = document.createElement('select');
        select.classList.add('ingredient-select');
        select.required = true;

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '食材を選択してください';
        select.appendChild(defaultOption);

        availableFoods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.id;
            option.textContent = food.name;
            if (food.id === foodId) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.classList.add('ingredient-amount');
        amountInput.placeholder = '量';
        amountInput.step = '0.1';
        amountInput.required = true;
        amountInput.value = amount;

        const unitSpan = document.createElement('span');
        unitSpan.classList.add('unit-display');
        unitSpan.textContent = '';

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

        amountInput.addEventListener('input', calculateDishTotals);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => {
            div.remove();
            calculateDishTotals();
        });

        div.appendChild(select);
        div.appendChild(amountInput);
        div.appendChild(unitSpan);
        div.appendChild(removeButton);
        ingredientsContainer.appendChild(div);

        if (foodId) {
            const selectedFood = availableFoods.find(f => f.id === foodId);
            if (selectedFood) {
                unitSpan.textContent = selectedFood.reference.unit;
            }
        }
    }

    addIngredientBtn.addEventListener('click', () => addIngredientEntry());

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

        const totalCalorie = parseFloat(dishTotalCalorieSpan.textContent);
        const totalProtein = parseFloat(dishTotalProteinSpan.textContent);
        const totalFat = parseFloat(dishTotalFatSpan.textContent);
        const totalCarb = parseFloat(dishTotalCarbSpan.textContent);

        const newDish = {
            name: dishName,
            ingredients: ingredients,
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
            ingredientsContainer.innerHTML = '';
            addIngredientEntry();
            calculateDishTotals();
            displayDishes();
        } catch (error) {
            console.error('料理の保存に失敗しました:', error);
            alert('料理の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの料理をHTMLリストに表示する関数 (変更あり)
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
                    <button class="delete-btn" data-id="${dish.id}" data-type="dish">削除</button>
                `;
                dishesListUl.appendChild(li);
            });
            // 削除ボタンのイベントリスナーを設定
            attachDeleteListeners('dish');
        } catch (error) {
            console.error('料理の取得に失敗しました:', error);
            dishesListUl.innerHTML = '<li>料理の読み込み中にエラーが発生しました。</li>';
        }
    }

    // ----------------------------------------------------
    // 削除機能の共通ロジック (新規追加)
    // ----------------------------------------------------
    /**
     * 指定されたタイプの削除ボタンにイベントリスナーを設定する
     * イベントデリゲーションを使用して、動的に追加される要素にも対応
     * @param {string} type - 'food' または 'dish'
     */
    function attachDeleteListeners(type) {
        const listUl = type === 'food' ? document.getElementById('registered-foods-ul') : document.getElementById('registered-dishes-ul');

        // イベントデリゲーション: 親要素にイベントリスナーを設定し、子要素からのイベントを捕捉
        listUl.addEventListener('click', async (event) => {
            // クリックされた要素が削除ボタン（.delete-btn）かどうかを確認
            if (event.target.classList.contains('delete-btn')) {
                const itemId = parseInt(event.target.dataset.id); // data-idからIDを取得
                const itemType = event.target.dataset.type; // data-typeからタイプを取得

                if (confirm(`${itemType === 'food' ? '食材' : '料理'}「${event.target.previousElementSibling.previousElementSibling.textContent}」を削除しますか？\nこの操作は元に戻せません。`)) {
                    try {
                        let storeName = '';
                        let refreshFunction;

                        if (itemType === 'food') {
                            storeName = 'foods';
                            refreshFunction = displayFoods;
                        } else if (itemType === 'dish') {
                            storeName = 'dishes';
                            refreshFunction = displayDishes;
                        }

                        if (storeName) {
                            await window.dbManager.deleteItem(storeName, itemId);
                            alert(`${itemType === 'food' ? '食材' : '料理'}が削除されました。`);
                            refreshFunction(); // リストを再表示して更新
                            if (itemType === 'food') {
                                populateFoodSelects(); // 食材が削除されたら料理フォームの選択肢も更新
                            }
                        }
                    } catch (error) {
                        console.error('削除に失敗しました:', error);
                        alert('削除中にエラーが発生しました。');
                    }
                }
            }
        });
    }

    // 初期ロード時に、料理登録フォームに最初の食材入力行を追加
    addIngredientEntry();

    // アプリ起動時にすべての食材を取得しておく（料理フォームのselect用）
    await populateFoodSelects();

    // アプリリロードボタンのイベントリスナー (既存)
    const reloadAppButton = document.getElementById('reload-app-button');
    if (reloadAppButton) {
        reloadAppButton.addEventListener('click', () => {
            if (confirm('アプリを最新バージョンに更新しますか？\n（現在入力中のデータは保存されません）')) {
                location.reload(true);
            }
        });
    }
});