import os
import subprocess
import logging
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("scheduler.log", mode='a')
    ]
)
logger = logging.getLogger(__name__)

def run_script(script_name, *args):
    """
    Запускает внешний Python-скрипт как отдельный процесс.
    Это изолирует планировщик от ошибок в логике скриптов.
    """
    command = ["python", script_name] + list(args)
    logger.info(f"🚀 Starting task: {' '.join(command)}")
    
    try:
        # capture_output=True позволяет перехватить вывод скрипта, чтобы записать его в лог планировщика
        result = subprocess.run(
            command, 
            check=True, 
            capture_output=True, 
            text=True
        )
        logger.info(f"✅ Task finished: {script_name}")
        if result.stdout:
            logger.info(f"[Output] {result.stdout.strip()}")
            
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Task FAILED: {script_name}. Exit code: {e.returncode}")
        if e.stdout:
            logger.error(f"[Stdout] {e.stdout.strip()}")
        if e.stderr:
            logger.error(f"[Stderr] {e.stderr.strip()}")
            
    except Exception as e:
        logger.error(f"🔥 Unexpected error running {script_name}: {e}")

def run_startup_checks():
    """
    Проверяет и выполняет пропущенные задачи при запуске контейнера.
    """
    logger.info("🕵️ Running startup checks for missed tasks...")
    
    # 1. Проверка обновления испытания (безопасно запускать всегда, внутри есть проверка актуальности)
    # Если испытание просрочено - оно обновится. Если нет - ничего не произойдет.
    logger.info("Checking daily challenge status...")
    run_script("cron_daily.py", "update")
    
    # 2. Проверка рассылки (если сейчас > 04:00 и есть неотправленные итоги)
    now_hour = datetime.now().hour
    # Используем системное время контейнера. 
    # Важно: В main() используется Timezone Europe/Moscow для планировщика, 
    # но datetime.now() вернет время контейнера (обычно UTC).
    # Учитывая, что в docker-compose TZ не проброшен, скорее всего это UTC.
    # 04:00 MSK = 01:00 UTC. 
    # Но cron_daily.py ориентируется на логику БД.
    # Давайте просто вызовем notify. Если pending_results нет - он ничего не сделает.
    # Если pending_results есть - значит итоги подведены, но не отправлены -> надо отправить.
    
    logger.info("Checking pending notifications...")
    run_script("cron_daily.py", "notify")
    
    logger.info("✅ Startup checks completed.")

def main():
    logger.info("⏳ Scheduler service starting (Timezone: Europe/Moscow)...")
    
    # Выполняем проверку пропущенных задач перед запуском планировщика
    run_startup_checks()

    # Используем Московское время для удобства настройки турниров
    scheduler = BlockingScheduler(timezone="Europe/Moscow")

    # --- 1. Ежедневное обновление ---
    # 03:00 по Москве == 00:00 UTC (время завершения испытания в БД)
    scheduler.add_job(
        run_script,
        CronTrigger(hour=0, minute=0),
        args=["cron_daily.py", "update"],
        name="daily_update"
    )

    # --- 2. Рассылка уведомлений ---
    # 07:00 по Москве == 04:00 UTC
    scheduler.add_job(
        run_script,
        CronTrigger(hour=4, minute=0),
        args=["cron_daily.py", "notify"],
        name="daily_notify"
    )

    # --- 3. Мониторинг турниров (Пример на будущее) ---
    # Запуск каждую минуту для проверки
    # scheduler.add_job(
    #     run_script,
    #     IntervalTrigger(minutes=1),
    #     args=["tournaments.py", "check"],
    #     name="tournament_monitor"
    # )

    logger.info(f"📅 Scheduled jobs: {[job.name for job in scheduler.get_jobs()]}")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Scheduler stopped.")

if __name__ == '__main__':
    main()