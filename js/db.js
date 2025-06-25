const DB_NAME = 'CalorieTrackerDB';
const DB_VERSION = 1;
const STORE_FOODS = 'foods'; // 食材を保存するオブジェクトストア名

let db;

/**
 * IndexedDBをオープンまたは作成する
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            // データベースのバージョンが変更されたときに実行される
            // （初回作成時やバージョンアップ時）
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_FOODS)) {
                // 'foods' オブジェクトストアを作成
                // keyPath: オブジェクトの一意な識別子となるプロパティ名
                db.createObjectStore(STORE_FOODS, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_FOODS}' created.`);
            }
            // 他のオブジェクトストア (料理、食事記録) もここに追加
            // if (!db.objectStoreNames.contains('dishes')) { ... }
            // if (!db.objectStoreNames.contains('meals')) { ... }
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
 * 食材を保存する
 * @param {object} food - 保存する食材データ
 */
async function addFood(food) {
    if (!db) await openDB(); // DBがまだ開かれていなければ開く
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readwrite');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.add(food);

        request.onsuccess = () => {
            console.log('Food added:', food);
            resolve(request.result); // 追加されたデータのキー（ID）を返す
        };

        request.onerror = (event) => {
            console.error('Error adding food:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * すべての食材を取得する
 */
async function getAllFoods() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.getAll(); // 全てのデータを取得

        request.onsuccess = () => {
            console.log('All foods retrieved:', request.result);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all foods:', event.target.error);
            reject(event.target.error);
        };
    });
}

// 他のCRUD操作（更新、削除）もここに追加していく

// グローバルスコープで利用できるようにエクスポート
// app.jsからこれらの関数を呼び出すために必要
window.dbManager = {
    openDB,
    addFood,
    getAllFoods
};