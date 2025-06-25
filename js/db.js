const DB_NAME = 'CalorieTrackerDB';
const DB_VERSION = 5; // バージョンは据え置き (データ構造変更がないため)
const STORE_FOODS = 'foods';
const STORE_DISHES = 'dishes';
const STORE_MEALS = 'meals'; // 新しく追加

let db;

/**
 * IndexedDBをオープンまたは作成する (既存)
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_FOODS)) {
                db.createObjectStore(STORE_FOODS, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_FOODS}' created.`);
            }
            if (!db.objectStoreNames.contains(STORE_DISHES)) {
                db.createObjectStore(STORE_DISHES, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_DISHES}' created.`);
            }
            // 食事記録ストアの作成 (新規)
            if (!db.objectStoreNames.contains(STORE_MEALS)) {
                const mealsStore = db.createObjectStore(STORE_MEALS, { keyPath: 'id', autoIncrement: true });
                // 日付で検索できるようにインデックスを作成
                mealsStore.createIndex('date', 'date', { unique: false });
                console.log(`Object store '${STORE_MEALS}' created with 'date' index.`);
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully:', DB_NAME);
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Error opening IndexedDB:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

/**
 * 食材を保存する (既存)
 */
async function addFood(food) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readwrite');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.add(food);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * すべての食材を取得する (既存)
 */
async function getAllFoods() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.getAll();
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 特定のIDの食材を取得する (既存)
 */
async function getFoodById(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.get(id);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 料理を保存する (既存)
 */
async function addDish(dish) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readwrite');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.add(dish);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * すべての料理を取得する (既存)
 */
async function getAllDishes() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readonly');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.getAll();
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 指定されたオブジェクトストアから指定されたIDのアイテムを削除する (新規追加)
 * @param {string} storeName - オブジェクトストアの名前 (例: 'foods', 'dishes')
 * @param {number} id - 削除するアイテムのID
 */
async function deleteItem(storeName, id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id); // deleteメソッドで削除

        request.onsuccess = () => {
            console.log(`Item with ID ${id} deleted from ${storeName}`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting item with ID ${id} from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}



// ----------------------------------------------------
// 食事記録関連の新規関数
// ----------------------------------------------------

/**
 * 食事記録を保存する (新規追加)
 * @param {object} meal - 保存する食事記録データ
 */
async function addMeal(meal) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MEALS], 'readwrite');
        const store = transaction.objectStore(STORE_MEALS);
        const request = store.add(meal);

        request.onsuccess = () => {
            console.log('Meal added:', meal);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error adding meal:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * すべての食事記録を取得する (新規追加)
 */
async function getAllMeals() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MEALS], 'readonly');
        const store = transaction.objectStore(STORE_MEALS);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log('All meals retrieved:', request.result);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all meals:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 特定のIDの食事記録を取得する (新規追加)
 */
async function getMealById(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MEALS], 'readonly');
        const store = transaction.objectStore(STORE_MEALS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting meal with ID ${id}:`, event.target.error);
            reject(event.target.error);
        };
    });
}


/**
 * 指定された日付の食事記録を取得する (新規追加)
 * @param {string} dateString - 取得したい日付文字列 (YYYY-MM-DD)
 */
async function getMealsByDate(dateString) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MEALS], 'readonly');
        const store = transaction.objectStore(STORE_MEALS);
        const dateIndex = store.index('date'); // 'date'インデックスを使用

        const request = dateIndex.getAll(dateString); // 指定日付のレコードを取得

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting meals for date ${dateString}:`, event.target.error);
            reject(event.target.error);
        };
    });
}


window.dbManager = {
    openDB,
    addFood,
    getAllFoods,
    getFoodById,
    addDish,
    getAllDishes,
    deleteItem,
    addMeal,       // 追加
    getAllMeals,   // 追加
    getMealById,   // 追加
    getMealsByDate // 追加
};