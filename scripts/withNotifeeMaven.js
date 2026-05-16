const { withProjectBuildGradle } = require('@expo/config-plugins/build/plugins/android-plugins');

module.exports = function withNotifeeMaven(config) {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            const targetString = "maven { url 'https://www.jitpack.io' }";
            const insertString = "\n    maven { url \"$rootDir/../node_modules/@notifee/react-native/android/libs\" }";

            // 중복 추가 방지 및 코드 삽입
            if (!config.modResults.contents.includes('@notifee/react-native')) {
                config.modResults.contents = config.modResults.contents.replace(
                    targetString,
                    `${targetString}\n${insertString}`
                );
            }
        }
        return config;
    });
};
