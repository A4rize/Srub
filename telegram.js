/*!
 * SRUB RUSSIA - Telegram Integration
 * Version: 1.0.0
 * Отправка данных форм в Telegram Bot
 */

// Создаем глобальный объект сразу
window.SrubTelegram = window.SrubTelegram || {};
window.sendToTelegram = window.sendToTelegram || async function(formData, formType) {
  // Делегируем вызов SrubTelegram.sendToTelegram
  if (window.SrubTelegram && window.SrubTelegram.sendToTelegram) {
    return window.SrubTelegram.sendToTelegram(formData, formType);
  }
  throw new Error('SrubTelegram.sendToTelegram is not available');
};

(function() {
  'use strict';

  // ===== КОНФИГУРАЦИЯ TELEGRAM =====
  const TELEGRAM_CONFIG = {
    botToken: '7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA',
    chatId: '7232379773' // ЗАМЕНИТЕ на ваш реальный chat ID!
  };

  // ===== ОТПРАВКА В TELEGRAM =====
  window.SrubTelegram.sendToTelegram = async function(formData, formType) {
    try {
      console.log('📤 Отправка данных в Telegram...', formData);

      // Формируем сообщение в зависимости от типа формы
      let message = formatMessage(formData, formType);

      // Отправляем через Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || 'Ошибка отправки в Telegram');
      }

      console.log('✅ Сообщение успешно отправлено в Telegram');
      return result;

    } catch (error) {
      console.error('❌ Ошибка отправки в Telegram:', error);
      throw error;
    }
  };

  // ===== ФОРМАТИРОВАНИЕ СООБЩЕНИЯ =====
  function formatMessage(data, formType) {
    const timestamp = new Date().toLocaleString('ru-RU');
    let message = '';

    switch(formType) {
      case 'planner-form':
        message = `
🏠 <b>НОВАЯ ЗАЯВКА - ПЛАНИРОВЩИК</b>

📋 <b>Параметры проекта:</b>
• Тип объекта: ${getTypeLabel(data.type)}
• Площадь: ${getAreaLabel(data.area)}
• Этажность: ${data.floors || 'Не указано'}
• Комплектация: ${getPackageLabel(data.package)}

👤 <b>Контактные данные:</b>
• Имя: ${data.name || 'Не указано'}
• Телефон: ${data.phone || 'Не указано'}

🕐 Дата: ${timestamp}
        `.trim();
        break;

      case 'cta-form':
        message = `
📞 <b>НОВАЯ ЗАЯВКА - КОНСУЛЬТАЦИЯ</b>

👤 <b>Контактные данные:</b>
• Имя: ${data.name || 'Не указано'}
• Телефон: ${data.phone || 'Не указано'}
• Email: ${data.email || 'Не указано'}

🕐 Дата: ${timestamp}
        `.trim();
        break;

      case 'modal-form':
        message = `
📲 <b>НОВАЯ ЗАЯВКА - ОБРАТНЫЙ ЗВОНОК</b>

👤 <b>Контактные данные:</b>
• Имя: ${data.name || 'Не указано'}
• Телефон: ${data.phone || 'Не указано'}

🕐 Дата: ${timestamp}
        `.trim();
        break;

      default:
        message = `
📨 <b>НОВАЯ ЗАЯВКА</b>

👤 <b>Данные:</b>
${Object.entries(data).map(([key, value]) => `• ${key}: ${value}`).join('\n')}

🕐 Дата: ${timestamp}
        `.trim();
    }

    return message;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function getTypeLabel(value) {
    const labels = {
      'house': '🏡 Дом',
      'bath': '🛁 Баня',
      'guest': '🏘️ Гостевой дом'
    };
    return labels[value] || value;
  }

  function getAreaLabel(value) {
    const labels = {
      '50': 'До 50 м²',
      '100': '50-100 м²',
      '150': '100-150 м²',
      '200': '150-200 м²',
      '250': 'Более 200 м²'
    };
    return labels[value] || value + ' м²';
  }

  function getPackageLabel(value) {
    const labels = {
      'basic': '📦 Базовая',
      'standard': '📦 Стандарт',
      'premium': '⭐ Премиум',
      'turnkey': '🔑 Под ключ'
    };
    return labels[value] || value;
  }

  // ===== ТЕСТОВАЯ ОТПРАВКА =====
  window.testTelegramConnection = async function() {
    try {
      const testData = {
        name: 'Тестовое сообщение',
        phone: '+7 (999) 123-45-67'
      };

      await sendToTelegram(testData, 'test');
      console.log('✅ Тест успешен! Проверьте Telegram');
      alert('Тест успешен! Проверьте ваш Telegram');
    } catch (error) {
      console.error('❌ Тест не пройден:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  console.log('✓ Telegram integration loaded');
  console.log('💡 Для теста выполните: testTelegramConnection()');

})();
