/*!
 * SRUB RUSSIA - Telegram Integration
 * Version: 2.0.0
 * Отправка данных форм в Telegram Bot
 */

// Создаем глобальный объект сразу
window.SrubTelegram = window.SrubTelegram || {};
window.sendToTelegram = window.sendToTelegram || async function(formData, formType) {
  if (window.SrubTelegram && window.SrubTelegram.sendToTelegram) {
    return window.SrubTelegram.sendToTelegram(formData, formType);
  }
  throw new Error('SrubTelegram.sendToTelegram is not available');
};

(function() {
  'use strict';

  // ===== КОНФИГУРАЦИЯ TELEGRAM =====
  // ВАЖНО: Замените эти значения на реальные!
  const TELEGRAM_CONFIG = {
    botToken: '7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA',
    chatId: '7232379773' // Замените на реальный chat ID
  };

  // ===== ОТПРАВКА В TELEGRAM =====
  window.SrubTelegram.sendToTelegram = async function(formData, formType) {
    try {
      console.log('📤 Отправка данных в Telegram...', { formData, formType });

      // Формируем сообщение в зависимости от типа формы
      let message = formatMessage(formData, formType);
      
      // Проверяем, что сообщение не пустое
      if (!message || message.trim() === '') {
        console.error('❌ Ошибка: сформированное сообщение пустое');
        console.log('Данные формы:', formData);
        console.log('Тип формы:', formType);
        
        // Создаем сообщение по умолчанию
        message = createDefaultMessage(formData, formType);
      }

      console.log('📝 Сформированное сообщение:', message);

      // Отправляем через Telegram Bot API
      const response = await fetch(`https://api.telegram.org/bot$7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA/sendMessage`, {
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
    try {
      const timestamp = new Date().toLocaleString('ru-RU');
      
      // Если данные пустые, создаем сообщение по умолчанию
      if (!data || Object.keys(data).length === 0) {
        return createDefaultMessage(data, formType);
      }

      let message = '';
      
      // Определяем тип формы
      const formTypeLower = (formType || '').toLowerCase();
      
      switch(true) {
        case formTypeLower.includes('planner'):
          message = `
🏠 <b>НОВАЯ ЗАЯВКА - ПЛАНИРОВЩИК</b>

📋 <b>Параметры проекта:</b>
${formatField('Тип объекта', getTypeLabel(data.type))}
${formatField('Площадь', getAreaLabel(data.area))}
${formatField('Этажность', data.floors)}
${formatField('Комплектация', getPackageLabel(data.package))}

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}

🕐 Дата: ${timestamp}
          `.trim();
          break;

        case formTypeLower.includes('cta'):
        case formTypeLower.includes('consult'):
          message = `
📞 <b>НОВАЯ ЗАЯВКА - КОНСУЛЬТАЦИЯ</b>

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}
${formatField('Email', data.email)}
${formatField('Сообщение', data.message)}

🕐 Дата: ${timestamp}
          `.trim();
          break;

        case formTypeLower.includes('callback'):
        case formTypeLower.includes('modal'):
          message = `
📲 <b>НОВАЯ ЗАЯВКА - ОБРАТНЫЙ ЗВОНОК</b>

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}

🕐 Дата: ${timestamp}
          `.trim();
          break;

        default:
          message = createDefaultMessage(data, formType);
      }

      return message.trim();
      
    } catch (error) {
      console.error('Ошибка при форматировании сообщения:', error);
      return createDefaultMessage(data, formType);
    }
  }

  // ===== СОЗДАНИЕ СООБЩЕНИЯ ПО УМОЛЧАНИЮ =====
  function createDefaultMessage(data, formType) {
    const timestamp = new Date().toLocaleString('ru-RU');
    const formTypeStr = formType || 'unknown';
    
    let fields = '';
    
    if (data && typeof data === 'object') {
      fields = Object.entries(data)
        .map(([key, value]) => formatField(getFieldLabel(key), value))
        .join('\n');
    } else {
      fields = '• Данные: нет информации';
    }
    
    return `
📨 <b>НОВАЯ ЗАЯВКА - ${formTypeStr.toUpperCase()}</b>

📋 <b>Информация о заявке:</b>
${fields}

🕐 Дата: ${timestamp}
    `.trim();
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function formatField(label, value) {
    if (!value) return `• ${label}: Не указано`;
    return `• ${label}: ${value}`;
  }

  function getFieldLabel(fieldName) {
    const labels = {
      'name': 'Имя',
      'phone': 'Телефон',
      'email': 'Email',
      'message': 'Сообщение',
      'comment': 'Комментарий',
      'type': 'Тип объекта',
      'area': 'Площадь',
      'floors': 'Этажность',
      'package': 'Комплектация',
      'agree': 'Согласие',
      'utm_source': 'UTM Source',
      'utm_medium': 'UTM Medium',
      'utm_campaign': 'UTM Campaign'
    };
    return labels[fieldName] || fieldName;
  }

  function getTypeLabel(value) {
    const labels = {
      'house': '🏡 Дом',
      'bath': '🛁 Баня',
      'guest': '🏘️ Гостевой дом',
      'house_bath': '🏡 Дом + Баня'
    };
    return labels[value] || value || 'Не указано';
  }

  function getAreaLabel(value) {
    const labels = {
      '50': 'До 50 м²',
      '100': '50-100 м²',
      '150': '100-150 м²',
      '200': '150-200 м²',
      '250': 'Более 200 м²'
    };
    return labels[value] || (value ? value + ' м²' : 'Не указано');
  }

  function getPackageLabel(value) {
    const labels = {
      'basic': '📦 Базовая',
      'standard': '📦 Стандарт',
      'premium': '⭐ Премиум',
      'turnkey': '🔑 Под ключ'
    };
    return labels[value] || value || 'Не указано';
  }

  // ===== ТЕСТОВАЯ ОТПРАВКА =====
  window.SrubTelegram.testConnection = async function() {
    try {
      const testData = {
        name: 'Тестовое сообщение',
        phone: '+7 (999) 123-45-67',
        email: 'test@srub-russia.ru',
        message: 'Это тестовое сообщение для проверки интеграции Telegram'
      };

      console.log('🔍 Тестирование подключения к Telegram...');
      
      // Проверяем конфигурацию
      if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
        throw new Error('Конфигурация Telegram не настроена');
      }

      await window.SrubTelegram.sendToTelegram(testData, 'test-connection');
      
      console.log('✅ Тест успешен! Проверьте Telegram');
      
      // Показываем алерт
      alert('✅ Тест успешен! Проверьте ваш Telegram');
      return true;
      
    } catch (error) {
      console.error('❌ Тест не пройден:', error);
      alert('❌ Ошибка: ' + error.message);
      return false;
    }
  };

  // Также добавляем старый вариант для совместимости
  window.testTelegramConnection = window.SrubTelegram.testConnection;

  console.log('✓ Telegram integration loaded');
  console.log('💡 Для теста выполните: testTelegramConnection()');

})();

