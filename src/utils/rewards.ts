export interface RewardItem {
    id: string;
    target: number;
    label: string;
    sub?: string;
    img?: string;
    category: 'words' | 'score' | 'marathon' | 'days' | 'rare_total' | 'rare_9_10' | 'rare_11';
}

export const REWARDS_DATA: { title: string; items: RewardItem[] }[] = [
    {
        title: "НАЙДЕННЫЕ СЛОВА",
        items: [
            { id: 'words_500', target: 500, label: "500 слов", category: 'words' },
            { id: 'words_1000', target: 1000, label: "1000 слов", category: 'words' },
            { id: 'words_2000', target: 2000, label: "2000 слов", category: 'words' },
            { id: 'words_5000', target: 5000, label: "5000 слов", category: 'words' },
            { id: 'words_10000', target: 10000, label: "10 000 слов", category: 'words' },
            { id: 'words_20000', target: 20000, label: "20 000 слов", category: 'words' },
        ]
    },
    {
        title: "РЕКОРД УРОВНЯ",
        items: [
            { id: 'score_1500', target: 1500, label: "1500 очков", category: 'score' },
            { id: 'score_3000', target: 3000, label: "3000 очков", category: 'score' },
            { id: 'score_5000', target: 5000, label: "5000 очков", category: 'score' },
        ]
    },
    {
        title: "СЛОВЕСНЫЙ МАРАФОН",
        items: [
            { id: 'marathon_100', target: 100, label: "Ловец секунд", sub: "+ 100 сек.", img: "./image/time100.png", category: 'marathon' },
            { id: 'marathon_300', target: 300, label: "Спринтер слов", sub: "+ 300 сек.", img: "./image/time300.png", category: 'marathon' },
            { id: 'marathon_500', target: 500, label: "Марафонец", sub: "+ 500 сек.", img: "./image/time500.png", category: 'marathon' },
        ]
    },
    {
        title: "ДНИ В ИГРЕ",
        items: [
            { id: 'days_30', target: 30, label: "30 дней", category: 'days' },
            { id: 'days_60', target: 60, label: "60 дней", category: 'days' },
            { id: 'days_120', target: 120, label: "120 дней", category: 'days' },
            { id: 'days_180', target: 180, label: "180 дней", category: 'days' },
            { id: 'days_270', target: 270, label: "270 дней", category: 'days' },
            { id: 'days_365', target: 365, label: "365 дней", category: 'days' },
        ]
    },
    {
        title: "РЕДКИЕ СЛОВА",
        items: [
            { id: 'rare_total_50', target: 50, label: "50 редких", category: 'rare_total' },
            { id: 'rare_total_100', target: 100, label: "100 редких", category: 'rare_total' },
            { id: 'rare_total_200', target: 200, label: "200 редких", category: 'rare_total' },
            { id: 'rare_9_10', target: 10, label: "10 (9-10 букв)", category: 'rare_9_10' },
            { id: 'rare_9_20', target: 20, label: "20 (9-10 букв)", category: 'rare_9_10' },
            { id: 'rare_11_10', target: 10, label: "10 (11+ букв)", category: 'rare_11' },
        ]
    }
];