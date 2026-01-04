  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = name + '=' + value + '; expires=' + expires + '; path=/';
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function trapFocus(container) {
    const focusable = container.find('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable.first();
    const last = focusable.last();

    container.on('keydown', function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first[0]) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last[0]) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  $(document).ready(function () {
    if (!getCookie('userConsent')) {
      $('#modal').css('display', 'flex');
      $('body').addClass('modal-open');
      $('#modal').focus();
      trapFocus($('#modal'));
    }

    $('#consent-checkbox').on('change', function () {
      $('#accept-consent').prop('disabled', !this.checked);
    });

    $('#accept-consent').on('click', function () {
      if ($('#consent-checkbox').is(':checked')) {
        setCookie('userConsent', 'yes', 7);
        console.log('User consent accepted.');
        $('#modal').hide();
        $('body').removeClass('modal-open');
      }
    });

    $('#decline-consent').on('click', function () {
      alert('You must accept the terms to continue using the site.');
      // Keep modal open
    });
  });