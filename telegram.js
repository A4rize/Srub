/*!
 * SRUB RUSSIA - Telegram Integration
 * Version: 2.2.0
 * Отправка данных форм в Telegram Bot
 */

// Создаем глобальный объект сразу
window.SrubTelegram = window.SrubTelegram || {};

(function() {
  'use strict';

  // ===== КОНФИГУРАЦИЯ TELEGRAM =====
  const TELEGRAM_CONFIG = {
    // ВНИМАНИЕ: Замените эти значения на свои реальные!
    botToken: '7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA',
    chatId: '7232379773'  // Замените на реальный chat ID
  };

  // ===== ПРОВЕРКА КОНФИГУРАЦИИ =====
  function checkConfig() {
    if (!TELEGRAM_CONFIG.botToken || TELEGRAM_CONFIG.botToken.includes('YOUR')) {
      console.error('❌ ОШИБКА: botToken не настроен!');
      console.log('💡 Получите токен у @BotFather в Telegram');
      return false;
    }
    
    if (!TELEGRAM_CONFIG.chatId || TELEGRAM_CONFIG.chatId.includes('YOUR')) {
      console.error('❌ ОШИБКА: chatId не настроен!');
      console.log('💡 Получите chatId у @getmyid_bot в Telegram');
      return false;
    }
    
    return true;
  }

  // ===== ОСНОВНАЯ ФУНКЦИЯ ОТПРАВКИ =====
  async function sendTelegramMessage(formData, formType) {
    try {
      console.log('📤 Отправка данных в Telegram...', { formData, formType });

      // Проверяем конфигурацию
      if (!checkConfig()) {
        throw new Error('Конфигурация Telegram не настроена. Проверьте консоль для инструкций.');
      }

      // Формируем сообщение
      let message = formatMessage(formData, formType);
      
      // Проверяем, что сообщение не пустое
      if (!message || message.trim() === '' || message === '<b></b>') {
        console.error('❌ Ошибка: сформированное сообщение пустое');
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
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const result = await response.json();

      if (!result.ok) {
        let errorMessage = result.description || 'Неизвестная ошибка Telegram API';
        
        // Расшифровка типичных ошибок
        if (errorMessage.includes('chat not found')) {
          errorMessage = 'Чат не найден. Убедитесь, что бот добавлен в чат и имеет права на отправку сообщений.';
        } else if (errorMessage.includes('bot was blocked')) {
          errorMessage = 'Бот заблокирован пользователем.';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = 'Доступ запрещен. Проверьте chatId и права бота.';
        } else if (errorMessage.includes('Unauthorized')) {
          errorMessage = 'Неверный токен бота. Проверьте botToken.';
        } else if (errorMessage.includes('message text is empty')) {
          errorMessage = 'Сообщение пустое. Проверьте данные формы.';
        }
        
        throw new Error(`Telegram API: ${errorMessage}`);
      }

      console.log('✅ Сообщение успешно отправлено в Telegram, ID:', result.result.message_id);
      return result;

    } catch (error) {
      console.error('❌ Ошибка отправки в Telegram:', error);
      
      // Дополнительная диагностика для CORS
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('⚠️ Возможная CORS ошибка. Проверьте настройки сервера.');
      }
      
      throw error;
    }
  }

  // ===== ФОРМАТИРОВАНИЕ СООБЩЕНИЯ =====
  function formatMessage(data, formType) {
    try {
      // Проверяем данные
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return createDefaultMessage(data, formType);
      }

      const timestamp = new Date().toLocaleString('ru-RU');
      const formTypeLower = (formType || 'contact').toLowerCase().trim();
      
      let message = '';

      switch(formTypeLower) {
        case 'planner-form':
        case 'planner':
          message = `🏠 <b>НОВАЯ ЗАЯВКА - ПЛАНИРОВЩИК СРУБОВ</b>

📋 <b>Параметры проекта:</b>
${formatField('Тип объекта', getTypeLabel(data.type))}
${formatField('Площадь', getAreaLabel(data.area))}
${formatField('Этажность', data.floors)}
${formatField('Комплектация', getPackageLabel(data.package))}

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}
${formatField('Email', data.email || '')}
${formatField('Сообщение', data.message || '')}

🕐 <b>Дата:</b> ${timestamp}

🌐 <b>Страница:</b> ${window.location.href}`;
          break;

        case 'cta-form':
        case 'consultation':
          message = `📞 <b>НОВАЯ ЗАЯВКА - КОНСУЛЬТАЦИЯ</b>

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}
${formatField('Email', data.email)}
${formatField('Сообщение', data.message || '')}

🕐 <b>Дата:</b> ${timestamp}

🌐 <b>Страница:</b> ${window.location.href}`;
          break;

        case 'callback-form':
        case 'modal-form':
        case 'modal-callback':
          message = `📲 <b>НОВАЯ ЗАЯВКА - ОБРАТНЫЙ ЗВОНОК</b>

👤 <b>Контактные данные:</b>
${formatField('Имя', data.name)}
${formatField('Телефон', data.phone)}

🕐 <b>Дата:</b> ${timestamp}

🌐 <b>Страница:</b> ${window.location.href}`;
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
    
    let fields = '• Данные: нет информации';
    
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      fields = Object.entries(data)
        .map(([key, value]) => formatField(getFieldLabel(key), value))
        .join('\n');
    }
    
    return `📨 <b>НОВАЯ ЗАЯВКА - ${formTypeStr.toUpperCase()}</b>

📋 <b>Информация о заявке:</b>
${fields}

🕐 <b>Дата:</b> ${timestamp}

🌐 <b>Страница:</b> ${window.location.href}`;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function formatField(label, value) {
    if (!value && value !== 0 && value !== false) return `• ${label}: Не указано`;
    if (value === true) return `• ${label}: Да`;
    if (value === false) return `• ${label}: Нет`;
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
      'agree': 'Согласие на обработку',
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

  // ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
  
  // Основная функция отправки
  window.SrubTelegram.sendToTelegram = sendTelegramMessage;
  
  // Алиас для обратной совместимости
  window.sendToTelegram = sendTelegramMessage;

  // ===== ТЕСТОВАЯ ОТПРАВКА =====
  window.SrubTelegram.testConnection = async function() {
    try {
      console.log('🔍 Тестирование подключения к Telegram...');
      
      // Проверяем конфигурацию
      if (!checkConfig()) {
        throw new Error('Конфигурация Telegram не настроена');
      }

      const testData = {
        name: 'Тестовое сообщение',
        phone: '+7 (999) 123-45-67',
        email: 'test@srub-russia.ru',
        message: 'Это тестовое сообщение для проверки интеграции Telegram',
        type: 'house',
        area: '150',
        floors: '2',
        package: 'standard'
      };

      console.log('📤 Отправка тестового сообщения...');
      const result = await sendTelegramMessage(testData, 'test-connection');
      
      console.log('✅ Тест успешен! ID сообщения:', result.result.message_id);
      
      // Показываем красивый алерт
      showAlert('success', 'Тест успешен!', 'Тестовое сообщение отправлено в Telegram.');
      
      return result;
      
    } catch (error) {
      console.error('❌ Тест не пройден:', error);
      
      showAlert('error', 'Ошибка подключения!', error.message);
      
      return { ok: false, error: error.message };
    }
  };

  // Алиас для тестовой функции
  window.testTelegramConnection = window.SrubTelegram.testConnection;

  // ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ АЛЕРТОВ =====
  function showAlert(type, title, message) {
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 99999;
      font-family: Arial, sans-serif;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    alertBox.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${type === 'success' ? '✅' : '❌'} ${title}</div>
      <div style="font-size: 14px;">${message}</div>
    `;
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
      alertBox.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => alertBox.remove(), 300);
    }, 5000);
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  console.log('📱 Telegram Integration v2.2.0 Loaded');
  console.log('===========================================');
  console.log('⚙️  Статус конфигурации:');
  console.log('   Bot Token:', TELEGRAM_CONFIG.botToken ? '✓ Установлен' : '✗ Не установлен');
  console.log('   Chat ID:', TELEGRAM_CONFIG.chatId ? '✓ Установлен' : '✗ Не установлен');
  console.log('===========================================');
  console.log('💡 Для теста выполните: testTelegramConnection()');

  // Стили для анимации алерта
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

})();

