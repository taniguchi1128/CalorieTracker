document.addEventListener('DOMContentLoaded', async () => {
    // IndexedDBを初期化
    await window.dbManager.openDB();
    displayFoods(); // ページロード時に既存の食材を表示

    // 食材登録フォームの処理
    const foodForm = document.getElementById('food-form');
    foodForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // フォームのデフォルト送信を防止

        const name = document.getElementById('food-name').value;
        const protein = parseFloat(document.getElementById('food-protein').value);
        const fat = parseFloat(document.getElementById('food-fat').value);
        const carb = parseFloat(document.getElementById('food-carb').value);

        // 入力値の簡易バリデーション
        if (!name || isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('すべての項目を正しく入力してください。');
            return;
        }

        const newFood = {
            name: name,
            pfc_per_100g: {
                protein: protein,
                fat: fat,
                carb: carb
            }
        };

        try {
            await window.dbManager.addFood(newFood);
            alert('食材が登録されました！');
            foodForm.reset(); // フォームをリセット
            displayFoods(); // 食材リストを更新
        } catch (error) {
            console.error('食材の保存に失敗しました:', error);
            alert('食材の保存中にエラーが発生しました。');
        }
    });

    /**
     * 登録済みの食材をHTMLリストに表示する関数
     */
    async function displayFoods() {
        const foodsListUl = document.getElementById('registered-foods-ul');
        foodsListUl.innerHTML = ''; // リストをクリア

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
                    <span>P: ${food.pfc_per_100g.protein}g F: ${food.pfc_per_100g.fat}g C: ${food.pfc_per_100g.carb}g (100gあたり)</span>
                `;
                foodsListUl.appendChild(li);
            });
        } catch (error) {
            console.error('食材の取得に失敗しました:', error);
            foodsListUl.innerHTML = '<li>食材の読み込み中にエラーが発生しました。</li>';
        }
    }
});