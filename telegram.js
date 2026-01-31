/*!
 * SRUB RUSSIA - Telegram Integration
 * Version: 3.0.0
 * Отправка данных форм через Vercel API
 */

// Создаем глобальный объект для API
window.SrubTelegram = window.SrubTelegram || {};

(function() {
  'use strict';

  // ===== КОНФИГУРАЦИЯ =====
  const CONFIG = {
    // URL вашего Vercel API
    apiUrl: 'https://srub.vercel.app/api/telegram',
    
    // Прямое подключение к Telegram (запасной вариант)
    directTelegram: {
      botToken: '7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA',
      chatId: null // Будет получен автоматически
    },
    
    // Настройки повторных попыток
    retry: {
      maxAttempts: 2,
      delay: 1000
    },
    
    // Логирование
    debug: true
  };

  // ===== ОСНОВНАЯ ФУНКЦИЯ ОТПРАВКИ =====
  async function sendTelegramMessage(formData, formType) {
    if (CONFIG.debug) {
      console.log('📤 [Telegram] Начинаем отправку...', { formType, formData });
    }

    // Обогащаем данные дополнительной информацией
    const enrichedData = enrichFormData(formData);
    
    try {
      // Пробуем отправить через Vercel API (основной способ)
      const result = await sendViaVercelAPI(enrichedData, formType);
      
      if (CONFIG.debug) {
        console.log('✅ [Telegram] Успешно отправлено через Vercel API:', result);
      }
      
      return {
        ok: true,
        result: {
          message_id: result.messageId || Date.now(),
          via: 'vercel-api'
        }
      };
      
    } catch (vercelError) {
      console.warn('⚠️ [Telegram] Ошибка Vercel API:', vercelError.message);
      
      // Fallback: пробуем прямой запрос к Telegram API
      try {
        console.log('🔄 [Telegram] Пробуем прямое подключение...');
        const directResult = await sendViaDirectAPI(enrichedData, formType);
        
        console.log('✅ [Telegram] Успешно отправлено напрямую');
        return {
          ok: true,
          result: {
            message_id: directResult.result?.message_id || Date.now(),
            via: 'direct-api'
          },
          warning: 'Использовано прямое подключение, Vercel API недоступен'
        };
        
      } catch (directError) {
        console.error('❌ [Telegram] Оба метода не сработали:', directError.message);
        
        // Сохраняем данные локально для последующей отправки
        saveToLocalStorage(enrichedData, formType);
        
        throw new Error(`Не удалось отправить заявку. Ошибки: Vercel - ${vercelError.message}, Direct - ${directError.message}`);
      }
    }
  }

  // ===== ОТПРАВКА ЧЕРЕЗ VERCEL API =====
  async function sendViaVercelAPI(data, formType) {
    if (CONFIG.debug) {
      console.log('🌐 [Vercel] Отправка на:', CONFIG.apiUrl);
    }

    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          data: data,
          formType: formType || 'contact-form'
        })
      });

      // Проверяем статус ответа
      if (!response.ok) {
        let errorText = 'Ошибка сети';
        try {
          const errorData = await response.json();
          errorText = errorData.error || `HTTP ${response.status}`;
        } catch (e) {
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`Vercel API: ${errorText}`);
      }

      // Парсим ответ
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Неизвестная ошибка Vercel API');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Vercel] Ошибка запроса:', error.message);
      throw error;
    }
  }

  // ===== ПРЯМАЯ ОТПРАВКА В TELEGRAM API =====
  async function sendViaDirectAPI(data, formType) {
    // Получаем или запрашиваем chatId
    let chatId = CONFIG.directTelegram.chatId;
    if (!chatId) {
      chatId = await getChatId();
      if (!chatId) {
        throw new Error('Не удалось получить chatId для прямого подключения');
      }
      CONFIG.directTelegram.chatId = chatId;
    }

    const message = formatDirectMessage(data, formType);
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${CONFIG.directTelegram.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.description || 'Ошибка Telegram API');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Direct] Ошибка прямой отправки:', error.message);
      throw error;
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

  // Обогащение данных формы
  function enrichFormData(data) {
    return {
      ...data,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'Прямой заход'
    };
  }

  // Получение chatId для прямого подключения
  async function getChatId() {
    try {
      // Пробуем получить из localStorage
      const savedChatId = localStorage.getItem('telegram_chat_id');
      if (savedChatId) {
        return savedChatId;
      }

      // Запрашиваем через бота (только если пользователь взаимодействовал с ботом)
      const response = await fetch(`https://api.telegram.org/bot${CONFIG.directTelegram.botToken}/getUpdates`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        const chatId = String(data.result[data.result.length - 1].message.chat.id);
        localStorage.setItem('telegram_chat_id', chatId);
        return chatId;
      }
      
      return null;
    } catch (error) {
      console.warn('Не удалось получить chatId:', error.message);
      return null;
    }
  }

  // Форматирование сообщения для прямого API
  function formatDirectMessage(data, formType) {
    const timestamp = new Date().toLocaleString('ru-RU');
    
    let message = `📨 Новая заявка с сайта\n`;
    message += `Тип: ${formType || 'не указан'}\n`;
    message += `Время: ${timestamp}\n`;
    message += `Страница: ${data.pageUrl || 'не указана'}\n\n`;
    
    // Добавляем основные поля
    if (data.name) message += `👤 Имя: ${data.name}\n`;
    if (data.phone) message += `📞 Телефон: ${data.phone}\n`;
    if (data.email) message += `📧 Email: ${data.email}\n`;
    if (data.message) message += `💬 Сообщение: ${data.message}\n`;
    
    // Добавляем дополнительные поля
    Object.entries(data).forEach(([key, value]) => {
      if (!['name', 'phone', 'email', 'message', 'pageUrl', 'userAgent', 'timestamp'].includes(key) && value) {
        message += `${key}: ${value}\n`;
      }
    });
    
    return message;
  }

  // Локальное сохранение заявок
  function saveToLocalStorage(data, formType) {
    try {
      const storageKey = 'srub_pending_requests';
      const pendingRequests = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      pendingRequests.push({
        id: Date.now(),
        data: data,
        formType: formType,
        timestamp: new Date().toISOString(),
        attempts: 0
      });
      
      localStorage.setItem(storageKey, JSON.stringify(pendingRequests));
      
      console.log('💾 Заявка сохранена локально. Всего сохранено:', pendingRequests.length);
      
      // Показываем уведомление пользователю
      showLocalSaveNotification(pendingRequests.length);
      
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  }

  // Уведомление о локальном сохранении
  function showLocalSaveNotification(count) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f39c12;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">⚠️ Внимание!</div>
      <div style="font-size: 14px;">
        Заявка сохранена локально (${count} шт.). 
        Мы отправим её как только восстановится связь с сервером.
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====

  // Основная функция отправки
  window.SrubTelegram.sendToTelegram = sendTelegramMessage;
  window.sendToTelegram = sendTelegramMessage;

  // Тестирование подключения
  window.SrubTelegram.testConnection = async function() {
    console.log('🔍 Тестирование подключения к Telegram через Vercel...');
    
    const testData = {
      name: 'Тестовое сообщение',
      phone: '+7 (999) 123-45-67',
      email: 'test@srub-russia.ru',
      message: 'Это тестовое сообщение для проверки работы Telegram бота через Vercel API'
    };
    
    try {
      const result = await sendTelegramMessage(testData, 'test-connection');
      
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      `;
      
      alertDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">✅ Тест успешен!</div>
        <div style="margin-bottom: 10px;">Сообщение отправлено через: <strong>${result.result.via}</strong></div>
        <div style="font-size: 14px; opacity: 0.9;">ID: ${result.result.message_id}</div>
        ${result.warning ? `<div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; font-size: 12px;">⚠️ ${result.warning}</div>` : ''}
      `;
      
      document.body.appendChild(alertDiv);
      
      setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
      }, 5000);
      
      return result;
      
    } catch (error) {
      console.error('❌ Тест не пройден:', error);
      
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      `;
      
      alertDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">❌ Ошибка подключения!</div>
        <div style="margin-bottom: 10px;">${error.message}</div>
        <div style="font-size: 12px; opacity: 0.8;">Проверьте консоль для подробностей</div>
      `;
      
      document.body.appendChild(alertDiv);
      
      setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 5000);
      }, 5000);
      
      throw error;
    }
  };

  // Алиас для тестирования
  window.testTelegramConnection = window.SrubTelegram.testConnection;

  // Просмотр сохраненных локально заявок
  window.SrubTelegram.showPendingRequests = function() {
    const pendingRequests = JSON.parse(localStorage.getItem('srub_pending_requests') || '[]');
    console.log('📋 Ожидающие отправки заявки:', pendingRequests);
    
    if (pendingRequests.length === 0) {
      alert('Нет заявок, ожидающих отправки.');
      return [];
    }
    
    alert(`Есть ${pendingRequests.length} заявок, ожидающих отправки. Проверьте консоль для деталей.`);
    return pendingRequests;
  };

  // Ручная отправка сохраненных заявок
  window.SrubTelegram.retryPendingRequests = async function() {
    const storageKey = 'srub_pending_requests';
    const pendingRequests = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (pendingRequests.length === 0) {
      alert('Нет заявок для повторной отправки.');
      return { success: 0, failed: 0 };
    }
    
    console.log(`🔄 Пробуем повторно отправить ${pendingRequests.length} заявок...`);
    
    const successful = [];
    const failed = [];
    
    for (const request of pendingRequests) {
      try {
        const result = await sendTelegramMessage(request.data, request.formType);
        successful.push(request.id);
      } catch (error) {
        failed.push({ id: request.id, error: error.message });
      }
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Удаляем успешно отправленные заявки
    const remainingRequests = pendingRequests.filter(req => !successful.includes(req.id));
    localStorage.setItem(storageKey, JSON.stringify(remainingRequests));
    
    const message = `Повторная отправка завершена:\nУспешно: ${successful.length}\nНе удалось: ${failed.length}`;
    console.log(message);
    alert(message);
    
    return { success: successful.length, failed: failed.length, failedDetails: failed };
  };

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  console.log('📱 Telegram Integration v3.0.0 Loaded');
  console.log('🌐 Vercel API URL:', CONFIG.apiUrl);
  console.log('💡 Для теста выполните: testTelegramConnection()');
  console.log('💡 Для просмотра сохраненных заявок: SrubTelegram.showPendingRequests()');

  // Добавляем стили для анимации
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

