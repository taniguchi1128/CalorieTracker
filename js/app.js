// Service WorkerのCACHE_NAMEと同期させるPWAのバージョン
// Service Workerのキャッシュを更新する際は、この値も同時に更新してください
const APP_VERSION = 'calorie-app-v5'; // ここを更新するたびにService WorkerのCACHE_NAMEも更新してください


document.addEventListener('DOMContentLoaded', async () => {
    // IndexedDBを初期化
    await window.dbManager.openDB();

    // --- DOM要素の取得 ---
    // 食材登録フォーム
    const foodForm = document.getElementById('food-form');
    const foodNameInput = document.getElementById('food-name');
    const foodReferenceAmountInput = document.getElementById('food-reference-amount');
    const foodReferenceUnitSelect = document.getElementById('food-reference-unit');
    const foodProteinInput = document.getElementById('food-protein');
    const foodFatInput = document.getElementById('food-fat');
    const foodCarbInput = document.getElementById('food-carb');
    const foodCalorieInput = document.getElementById('food-calorie');
    const foodsListUl = document.getElementById('registered-foods-ul');

    // 料理登録フォーム
    const dishForm = document.getElementById('dish-form');
    const dishNameInput = document.getElementById('dish-name');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const ingredientsContainer = document.getElementById('dish-ingredients-container');
    const dishTotalCalorieSpan = document.getElementById('dish-total-calorie');
    const dishTotalProteinSpan = document.getElementById('dish-total-protein');
    const dishTotalFatSpan = document.getElementById('dish-total-fat');
    const dishTotalCarbSpan = document.getElementById('dish-total-carb');
    const registeredDishesUl = document.getElementById('registered-dishes-ul');

    // 食事記録フォーム
    const mealForm = document.getElementById('meal-form');
    const mealDateInput = document.getElementById('meal-date');
    const addMealItemBtn = document.getElementById('add-meal-item-btn');
    const mealItemsContainer = document.getElementById('meal-items-container');
    const mealTotalCalorieSpan = document.getElementById('meal-total-calorie');
    const mealTotalProteinSpan = document.getElementById('meal-total-protein');
    const mealTotalFatSpan = document.getElementById('meal-total-fat');
    const mealTotalCarbSpan = document.getElementById('meal-total-carb');
    const viewMealDateInput = document.getElementById('view-meal-date');
    const registeredMealsUl = document.getElementById('registered-meals-ul');

    // アプリ設定
    const reloadAppButton = document.getElementById('reload-app-button');
    const appVersionSpan = document.getElementById('app-version');

    // --- グローバル変数と初期化関連の関数定義 ---
    let availableFoods = []; // 登録済みの食材リストを保持 (料理フォーム、食事記録フォーム用)
    let allAvailableItems = []; // 食材と料理の結合リストを保持 (食事記録フォーム用)

    /**
     * 食事記録フォームの日付入力に現在の日付を設定する関数
     */
    function initializeMealForm() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayString = `${yyyy}-${mm}-${dd}`;
        mealDateInput.value = todayString;
        viewMealDateInput.value = todayString; // 食事記録表示の日付も初期設定
    }

    /**
     * 食材と料理のリストを結合して、食事記録フォームの選択肢を更新する関数
     */
    async function populateMealItemSelects() {
        const foods = await window.dbManager.getAllFoods();
        const dishes = await window.dbManager.getAllDishes();

        // 食材と料理を区別できるようtypeプロパティを追加
        const formattedFoods = foods.map(food => ({
            id: food.id,
            name: food.name,
            type: 'food',
            reference: food.reference,
            pfc_per_reference: food.pfc_per_reference,
            calorie_per_reference: food.calorie_per_reference
        }));
        const formattedDishes = dishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            type: 'dish',
            total_pfc: dish.total_pfc,
            total_calorie: dish.total_calorie
        }));
        allAvailableItems = [...formattedFoods, ...formattedDishes];
    }

    /**
     * 食材選択のプルダウンを生成・更新する関数 (料理フォーム用)
     */
    async function populateFoodSelects() {
        availableFoods = await window.dbManager.getAllFoods();
    }

    // --- 初期処理の呼び出し (DOM要素が全て取得された後) ---
    initializeMealForm(); // 食事記録フォームの日付を初期化
    await populateFoodSelects(); // 食材データを取得
    await populateMealItemSelects(); // 食材と料理データを取得し、食事記録フォームの選択肢を生成

    displayFoods(); // 食材リストを表示
    displayDishes(); // 料理リストを表示
    displayMealsForSelectedDate(); // 選択された日付の食事を初期表示

    addIngredientEntry(); // 料理登録フォームに初期の食材入力行を追加
    addMealItemEntry(); // 食事記録フォームに初期のアイテム入力行を追加


    // --- 食材登録フォームの処理 ---
    foodForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = foodNameInput.value;
        const referenceAmount = parseFloat(foodReferenceAmountInput.value);
        const referenceUnit = foodReferenceUnitSelect.value;
        const protein = parseFloat(foodProteinInput.value);
        const fat = parseFloat(foodFatInput.value);
        const carb = parseFloat(foodCarbInput.value);
        const calorie = parseFloat(foodCalorieInput.value);

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
            populateMealItemSelects(); // 食事記録フォームの選択肢も更新
        } catch (error) {
            console.error('食材の保存に失敗しました:', error);
            alert('食材の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの食材をHTMLリストに表示する関数
     */
    async function displayFoods() {
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
        } catch (error) {
            console.error('食材の取得に失敗しました:', error);
            foodsListUl.innerHTML = '<li>食材の読み込み中にエラーが発生しました。</li>';
        }
    }

    // --- 料理登録フォームの処理 ---
    addIngredientBtn.addEventListener('click', () => addIngredientEntry());

    /**
     * 新しい食材入力行を料理フォームに追加する関数
     */
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

        select.addEventListener('change', () => {
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


    /**
     * 料理の合計PFCとカロリーを計算し、表示を更新する関数
     */
    async function calculateDishTotals() {
        let totalCalorie = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCarb = 0;

        const ingredientEntries = document.querySelectorAll('.ingredient-entry');

        for (const entry of ingredientEntries) {
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
        }

        dishTotalCalorieSpan.textContent = totalCalorie.toFixed(1);
        dishTotalProteinSpan.textContent = totalProtein.toFixed(1);
        dishTotalFatSpan.textContent = totalFat.toFixed(1);
        dishTotalCarbSpan.textContent = totalCarb.toFixed(1);
    }

    dishForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dishName = dishNameInput.value;
        if (!dishName) {
            alert('料理名を入力してください。');
            return;
        }

        const ingredients = [];
        const ingredientEntries = document.querySelectorAll('.ingredient-entry');
        let isValid = true;

        for (const entry of ingredientEntries) {
            const foodSelect = entry.querySelector('.ingredient-select');
            const amountInput = entry.querySelector('.ingredient-amount');

            const foodId = parseInt(foodSelect.value);
            const amount = parseFloat(amountInput.value);

            if (!foodId || isNaN(amount) || amount <= 0) {
                isValid = false;
                break;
            }

            ingredients.push({
                foodId: foodId,
                amount: amount
            });
        }

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
            populateMealItemSelects(); // 料理が登録されたら食事記録フォームの選択肢も更新
        } catch (error) {
            console.error('料理の保存に失敗しました:', error);
            alert('料理の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの料理をHTMLリストに表示する関数
     */
    async function displayDishes() {
        registeredDishesUl.innerHTML = '';

        try {
            const dishes = await window.dbManager.getAllDishes();
            if (dishes.length === 0) {
                registeredDishesUl.innerHTML = '<li>登録済みの料理はありません。</li>';
                return;
            }

            dishes.forEach(dish => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${dish.name}</span>
                    <span>Kcal: ${dish.total_calorie}kcal P: ${dish.total_pfc.protein}g F: ${dish.total_pfc.fat}g C: ${dish.total_pfc.carb}g</span>
                    <button class="delete-btn" data-id="${dish.id}" data-type="dish">削除</button>
                `;
                registeredDishesUl.appendChild(li);
            });
        } catch (error) {
            console.error('料理の取得に失敗しました:', error);
            registeredDishesUl.innerHTML = '<li>料理の読み込み中にエラーが発生しました。</li>';
        }
    }


    // --- 食事記録フォームの処理 ---
    addMealItemBtn.addEventListener('click', () => addMealItemEntry());

    /**
     * 新しい食事アイテム入力行を食事記録フォームに追加する関数
     */
    function addMealItemEntry(itemId = '', itemType = '', amount = '') {
        const div = document.createElement('div');
        div.classList.add('meal-item-entry');

        const select = document.createElement('select');
        select.classList.add('item-type-select');
        select.required = true;

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '食材または料理を選択';
        select.appendChild(defaultOption);

        allAvailableItems.forEach(item => {
            const option = document.createElement('option');
            // valueは 'type-[id]' の形式にする
            option.value = `${item.type}-${item.id}`;
            option.textContent = `${item.name} (${item.type === 'food' ? '食材' : '料理'})`;
            if (item.type === itemType && item.id === itemId) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.classList.add('meal-item-amount');
        amountInput.placeholder = '量';
        amountInput.step = '0.1';
        amountInput.required = true;
        amountInput.value = amount;

        const unitSpan = document.createElement('span');
        unitSpan.classList.add('unit-display');
        unitSpan.textContent = '';

        select.addEventListener('change', () => {
            const [type, id] = select.value.split('-');
            const selectedItem = allAvailableItems.find(item => item.type === type && item.id === parseInt(id));
            if (selectedItem) {
                // 食材なら基準単位、料理なら「食」や「皿」など固定、または空欄
                unitSpan.textContent = selectedItem.type === 'food' ? selectedItem.reference.unit : '食';
            } else {
                unitSpan.textContent = '';
            }
            calculateMealTotals();
        });

        amountInput.addEventListener('input', calculateMealTotals);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => {
            div.remove();
            calculateMealTotals();
        });

        div.appendChild(select);
        div.appendChild(amountInput);
        div.appendChild(unitSpan);
        div.appendChild(removeButton);
        mealItemsContainer.appendChild(div);

        // 初期選択があれば単位表示を更新
        if (itemId && itemType) {
            const selectedItem = allAvailableItems.find(item => item.type === itemType && item.id === itemId);
            if (selectedItem) {
                unitSpan.textContent = selectedItem.type === 'food' ? selectedItem.reference.unit : '食';
            }
        }
    }


    /**
     * 食事記録の合計PFCとカロリーを計算し、表示を更新する関数
     */
    async function calculateMealTotals() {
        let totalCalorie = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCarb = 0;

        const mealItemEntries = document.querySelectorAll('.meal-item-entry');

        for (const entry of mealItemEntries) {
            const itemSelect = entry.querySelector('.item-type-select');
            const amountInput = entry.querySelector('.meal-item-amount');

            const [itemType, itemIdStr] = itemSelect.value.split('-');
            const itemId = parseInt(itemIdStr);
            const amount = parseFloat(amountInput.value);

            if (itemId && !isNaN(amount) && amount > 0) {
                const selectedItem = allAvailableItems.find(item => item.type === itemType && item.id === itemId);

                if (selectedItem) {
                    if (itemType === 'food') {
                        const refAmount = selectedItem.reference.amount;
                        const pfc = selectedItem.pfc_per_reference;
                        const calorie = selectedItem.calorie_per_reference;
                        const ratio = amount / refAmount;

                        totalCalorie += calorie * ratio;
                        totalProtein += pfc.protein * ratio;
                        totalFat += pfc.fat * ratio;
                        totalCarb += pfc.carb * ratio;
                    } else if (itemType === 'dish') {
                        const pfc = selectedItem.total_pfc;
                        const calorie = selectedItem.total_calorie;

                        totalCalorie += calorie * amount; // 量は「何食分」なので直接掛ける
                        totalProtein += pfc.protein * amount;
                        totalFat += pfc.fat * amount;
                        totalCarb += pfc.carb * amount;
                    }
                }
            }
        }

        mealTotalCalorieSpan.textContent = totalCalorie.toFixed(1);
        mealTotalProteinSpan.textContent = totalProtein.toFixed(1);
        mealTotalFatSpan.textContent = totalFat.toFixed(1);
        mealTotalCarbSpan.textContent = totalCarb.toFixed(1);
    }


    // 食事記録フォームの送信イベント
    mealForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const mealDate = mealDateInput.value;
        if (!mealDate) {
            alert('日付を選択してください。');
            return;
        }

        const mealItems = [];
        const mealItemEntries = document.querySelectorAll('.meal-item-entry');
        let isValid = true;

        for (const entry of mealItemEntries) {
            const itemSelect = entry.querySelector('.item-type-select');
            const amountInput = entry.querySelector('.meal-item-amount');

            const [itemType, itemIdStr] = itemSelect.value.split('-');
            const itemId = parseInt(itemIdStr);
            const amount = parseFloat(amountInput.value);

            if (!itemType || !itemId || isNaN(amount) || amount <= 0) {
                isValid = false;
                break;
            }

            mealItems.push({
                type: itemType, // 'food' or 'dish'
                id: itemId,
                amount: amount
            });
        }

        if (!isValid) {
            alert('食べたもの（食材/料理と量）を正しく入力してください。');
            return;
        }
        if (mealItems.length === 0) {
            alert('食べたものを1つ以上追加してください。');
            return;
        }

        const totalCalorie = parseFloat(mealTotalCalorieSpan.textContent);
        const totalProtein = parseFloat(mealTotalProteinSpan.textContent);
        const totalFat = parseFloat(mealTotalFatSpan.textContent);
        const totalCarb = parseFloat(mealTotalCarbSpan.textContent);

        const newMeal = {
            date: mealDate,
            items: mealItems, // 食べたアイテムのタイプ、ID、量
            total_pfc: {
                protein: totalProtein,
                fat: totalFat,
                carb: totalCarb
            },
            total_calorie: totalCalorie
        };

        try {
            await window.dbManager.addMeal(newMeal);
            alert('食事記録を保存しました！');
            mealForm.reset();
            initializeMealForm(); // 日付をリセットし、本日を設定
            mealItemsContainer.innerHTML = ''; // 食事アイテムリストをクリア
            addMealItemEntry(); // 初期状態で1行追加
            calculateMealTotals(); // 合計表示をリセット
            displayMealsForSelectedDate(); // 記録された食事リストを更新
        } catch (error) {
            console.error('食事記録の保存に失敗しました:', error);
            alert('食事記録の保存中にエラーが発生しました。');
        }
    });

    /**
     * 選択された日付の食事記録を表示する関数
     */
    async function displayMealsForSelectedDate() {
        const selectedDate = viewMealDateInput.value;
        registeredMealsUl.innerHTML = '';

        if (!selectedDate) {
            registeredMealsUl.innerHTML = '<li>日付を選択してください。</li>';
            return;
        }

        try {
            const meals = await window.dbManager.getMealsByDate(selectedDate);
            if (meals.length === 0) {
                registeredMealsUl.innerHTML = `<li>${selectedDate} の食事記録はありません。</li>`;
                return;
            }

            // アイテムの詳細名を取得するためのマップを作成 (パフォーマンス改善)
            const itemMap = new Map();
            allAvailableItems.forEach(item => {
                itemMap.set(`${item.type}-${item.id}`, item.name);
            });

            meals.forEach(meal => {
                const li = document.createElement('li');
                let itemsSummary = meal.items.map(item => {
                    const itemName = itemMap.get(`${item.type}-${item.id}`);
                    const unit = item.type === 'food' ?
                        (allAvailableItems.find(ai => ai.type === item.type && ai.id === item.id)?.reference?.unit || '') : '食';
                    return itemName ? `${itemName} (${item.amount}${unit})` : '不明なアイテム';
                }).join(', ');

                li.innerHTML = `
                    <span>日付: ${meal.date}</span><br>
                    <span>内容: ${itemsSummary}</span><br>
                    <span>Kcal: ${meal.total_calorie.toFixed(1)}kcal P: ${meal.total_pfc.protein.toFixed(1)}g F: ${meal.total_pfc.fat.toFixed(1)}g C: ${meal.total_pfc.carb.toFixed(1)}g</span>
                    <button class="delete-btn" data-id="${meal.id}" data-type="meal">削除</button>
                `;
                registeredMealsUl.appendChild(li);
            });
        } catch (error) {
            console.error('食事記録の取得に失敗しました:', error);
            registeredMealsUl.innerHTML = '<li>食事記録の読み込み中にエラーが発生しました。</li>';
        }
    }

    // 食事記録表示の日付が変更されたら、リストを更新
    viewMealDateInput.addEventListener('change', displayMealsForSelectedDate);

    // --- 削除機能の共通ロジック (メイン要素に対するイベントデリゲーション) ---
    document.querySelector('main').addEventListener('click', async (event) => {
        // クリックされた要素が削除ボタン（.delete-btn）かどうかを確認
        if (event.target.classList.contains('delete-btn')) {
            const itemId = parseInt(event.target.dataset.id); // data-idからIDを取得
            const itemType = event.target.dataset.type; // data-typeからタイプを取得

            let confirmMessage = '';
            let storeName = '';
            let refreshFunction;

            if (itemType === 'food') {
                confirmMessage = '食材';
                storeName = 'foods';
                refreshFunction = displayFoods;
            } else if (itemType === 'dish') {
                confirmMessage = '料理';
                storeName = 'dishes';
                refreshFunction = displayDishes;
            } else if (itemType === 'meal') {
                confirmMessage = '食事記録';
                storeName = 'meals';
                refreshFunction = displayMealsForSelectedDate;
            }

            // 削除対象の名前を取得 (HTML構造に依存するので注意)
            // 食材・料理は最初のspan、食事記録は最初のspanの日付部分を抜いたもの
            const closestLi = event.target.closest('li');
            let itemName = 'このアイテム';
            if (closestLi) {
                const firstSpan = closestLi.querySelector('span');
                if (firstSpan) {
                    itemName = firstSpan.textContent.replace(/^日付: /, '');
                    if (itemName.length > 20) { // 長すぎる場合は省略
                        itemName = itemName.substring(0, 17) + '...';
                    }
                }
            }


            if (confirm(`${confirmMessage}「${itemName}」を削除しますか？\nこの操作は元に戻せません。`)) {
                try {
                    if (storeName) {
                        await window.dbManager.deleteItem(storeName, itemId);
                        alert(`${confirmMessage}が削除されました。`);
                        refreshFunction(); // リストを再表示して更新
                        if (itemType === 'food') {
                            // 食材が削除されたら、料理・食事記録フォームの選択肢も更新
                            populateFoodSelects();
                            populateMealItemSelects();
                        } else if (itemType === 'dish') {
                            // 料理が削除されたら、食事記録フォームの選択肢も更新
                            populateMealItemSelects();
                        }
                    }
                } catch (error) {
                    console.error('削除に失敗しました:', error);
                    alert('削除中にエラーが発生しました。');
                }
            }
        }
    });


    // --- アプリリロードボタンのイベントリスナー ---
    if (reloadAppButton) {
        reloadAppButton.addEventListener('click', () => {
            if (confirm('アプリを最新バージョンに更新しますか？\n（現在入力中のデータは保存されません）')) {
                location.reload(true);
            }
        });
    }

    if (appVersionSpan) {
        appVersionSpan.textContent = APP_VERSION;
    }
});