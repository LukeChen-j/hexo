!function () {

   const canvas = document.getElementById("snowBackground");
   if (!canvas || !canvas.getContext) return;
   const ctx = canvas.getContext("2d");

   const CONFIG = {
       DENSITY_FACTOR: 8,
       BASE_SPEED_Y: 0.8,
       RAND_SPEED_Y_AMP: 0.6,
       BASE_SPEED_X: 0,
       RAND_SPEED_X_AMP: 0.8,
       MIN_Z: 0.1,
       MAX_Z: 0.7,
       DEPTH_DISTRIBUTION_EXPONENT: 3, // >1 偏向远处
       BASE_RADIUS: 1.6,
       RAND_RADIUS_AMP: 1.0,
       OPACITY_MIN: 0.6, // 浅色背景下，最小透明度稍微高一点
       OPACITY_MAX: 0.9, // 浅色背景下，最大透明度稍微高一点
       MOUSE_FRICTION: 0.90,
       MOUSE_FACTOR: 0.08,
       TRAIL_LENGTH_FACTOR: 1.5,
       COLOR_RGBA_PREFIX: "rgba(255, 255, 255, ", // 白色雪花
       RESET_MARGIN: 80, // 增加一点边界，防止阴影或长轨迹突然消失
       MIN_FLAKES: 25,
       // --- 新增阴影配置 ---
       SHADOW_COLOR_PREFIX: "rgba(0, 0, 55, ", // 阴影颜色基础 (深蓝灰)
       SHADOW_OPACITY_FACTOR: 0.4, // 阴影透明度 = flake.opacity * factor
       SHADOW_BLUR: 2.5,
       SHADOW_OFFSET_X: 1,
       SHADOW_OFFSET_Y: 1.5,
       // --------------------
   };

   let width = 0;
   let height = 0;
   let devicePixelRatio = 1;
   const flakes = [];
   let flakeCount = 0;

   let prevMouseX = null;
   let prevMouseY = null;
   const mouseInfluence = { vx: 0, vy: 0 };
   
   // 辅助函数：在范围内生成随机数
   const randomInRange = (min, max) => min + Math.random() * (max - min);
    // 辅助函数：在边界内随机（包含margin）
    const randomXWithMargin = () => randomInRange(-CONFIG.RESET_MARGIN, width + CONFIG.RESET_MARGIN);
    const randomYWithMargin = () => randomInRange(-CONFIG.RESET_MARGIN, height + CONFIG.RESET_MARGIN);


   function createFlake() {
      return { x: 0, y: 0, z: 0, radius: 0, opacity: 0, baseVx: 0, baseVy: 0 };
   }

   // 回收并重新随机化粒子属性
   function recycleFlake(flake) {
       const depthRand = Math.pow(Math.random(), CONFIG.DEPTH_DISTRIBUTION_EXPONENT);
       flake.z = CONFIG.MIN_Z + (CONFIG.MAX_Z - CONFIG.MIN_Z) * depthRand;
       const coreRadius = CONFIG.BASE_RADIUS + Math.random() * CONFIG.RAND_RADIUS_AMP;
       flake.radius = Math.max(0.5, coreRadius * flake.z); // 确保最小半径
       flake.opacity = CONFIG.OPACITY_MIN + (CONFIG.OPACITY_MAX - CONFIG.OPACITY_MIN) * flake.z;
       flake.baseVx = (CONFIG.BASE_SPEED_X + (Math.random() - 0.5) * CONFIG.RAND_SPEED_X_AMP) * flake.z;
       flake.baseVy = (CONFIG.BASE_SPEED_Y + Math.random() * CONFIG.RAND_SPEED_Y_AMP) * flake.z;
   }

    // 修改：初始化粒子: 回收属性 + 随机化位置 (包含 margin 区域)
   function initFlakePosition(flake) {
       recycleFlake(flake);
       flake.x = randomXWithMargin(); //Math.random() * (width + 2 * CONFIG.RESET_MARGIN) - CONFIG.RESET_MARGIN;
       flake.y = randomYWithMargin(); //Math.random() * (height + 2 * CONFIG.RESET_MARGIN) - CONFIG.RESET_MARGIN;
   }


   function setup() {
       devicePixelRatio = window.devicePixelRatio || 1;
       width = window.innerWidth;
       height = window.innerHeight;
       flakeCount = Math.max(CONFIG.MIN_FLAKES, Math.floor((width + height) / CONFIG.DENSITY_FACTOR));

       canvas.style.width = width + "px";
       canvas.style.height = height + "px";
       canvas.width = width * devicePixelRatio;
       canvas.height = height * devicePixelRatio;
       ctx.scale(devicePixelRatio, devicePixelRatio);
       ctx.lineCap = "round";

       const currentFlakes = flakes.length;
        if (currentFlakes < flakeCount) {
           for (let i = currentFlakes; i < flakeCount; i++) {
                const flake = createFlake();
                initFlakePosition(flake); 
                flakes.push(flake);
           }
       } else {
            flakes.length = flakeCount;
       }
        // 窗口变化时，重新随机分布所有现有雪花(包含margin)
       flakes.forEach(initFlakePosition);
   }

   // 修改：绘制单个粒子及其轨迹和阴影
  function drawFlake(flake, totalDx, totalDy){
         const trailX = flake.x - totalDx * CONFIG.TRAIL_LENGTH_FACTOR;
         const trailY = flake.y - totalDy * CONFIG.TRAIL_LENGTH_FACTOR;
         
         // --- 应用阴影 ---
         // 使用 save/restore 确保阴影只应用到当前粒子
         ctx.save(); 
         ctx.shadowColor = CONFIG.SHADOW_COLOR_PREFIX + (flake.opacity * CONFIG.SHADOW_OPACITY_FACTOR) + ")";
         ctx.shadowBlur = CONFIG.SHADOW_BLUR * flake.z; // 远处阴影更模糊/或更小
         ctx.shadowOffsetX = CONFIG.SHADOW_OFFSET_X * flake.z; // 远处阴影偏移小
         ctx.shadowOffsetY = CONFIG.SHADOW_OFFSET_Y * flake.z; // 远处阴影偏移小
         // ------------------

         ctx.beginPath();
         ctx.strokeStyle = CONFIG.COLOR_RGBA_PREFIX + flake.opacity + ")";
         ctx.lineWidth = flake.radius * 2; 
         ctx.moveTo(trailX, trailY); 
         ctx.lineTo(flake.x, flake.y);
         ctx.stroke();
         
         ctx.restore(); // --- 恢复 context 状态，清除阴影设置 ---
  }


   function animate() {
       ctx.clearRect(0, 0, width, height);

       mouseInfluence.vx *= CONFIG.MOUSE_FRICTION;
       mouseInfluence.vy *= CONFIG.MOUSE_FRICTION;

       const margin = CONFIG.RESET_MARGIN;

       flakes.forEach(function(flake) {
          
           const mouseVx = mouseInfluence.vx * flake.z;
           const mouseVy = mouseInfluence.vy * flake.z;
           const totalDx = flake.baseVx + mouseVx;
           const totalDy = flake.baseVy + mouseVy;

           flake.x += totalDx;
           flake.y += totalDy;

           // --- 修改：粒子回收与重置逻辑 ---
           let positionReset = false; // 标记位置是否已重置

           // 1. 垂直越界: 回收属性, 随机 X(含margin), Y放到另一侧 margin 区域内
            if (flake.y > height + margin) { // 从底部出
               recycleFlake(flake); 
               flake.x = randomXWithMargin(); 
                // 放置在 0 到 -margin 之间
               flake.y = -Math.random() * margin; 
               positionReset = true;
           } else if (flake.y < -margin) { // 从顶部出
               recycleFlake(flake); 
               flake.x = randomXWithMargin(); 
               // 放置在 height 到 height + margin 之间
                flake.y = height + Math.random() * margin; 
                positionReset = true;
           }
           
            // 2. 水平越界 (仅当垂直未越界时): 不回收属性, 随机 Y(含margin), X放到另一侧 margin 区域内
           if(!positionReset){
                if (flake.x > width + margin) { // 从右侧出
                   // recycleFlake(flake); // <-- 不要重置属性
                   // flake.x = -Math.random() * margin; 
                   flake.x = -margin; 
                   flake.y = randomYWithMargin(); 
                } else if (flake.x < -margin) { // 从左侧出
                    // recycleFlake(flake); // <-- 不要重置属性
                    // flake.x = width + Math.random() * margin; 
                    flake.x = width + margin; 
                    flake.y = randomYWithMargin(); 
               }
           }
           // ---------------------------------

           drawFlake(flake, totalDx, totalDy);
       });

       requestAnimationFrame(animate);
   }

    window.addEventListener("resize", setup);
     document.addEventListener("mousemove", function(e) {
       //mouseX = e.clientX; mouseY = e.clientY; // not needed
       if (typeof prevMouseX === 'number' && typeof prevMouseY === 'number') {
           const dx = e.clientX - prevMouseX;
           const dy = e.clientY - prevMouseY;
           mouseInfluence.vx += dx * CONFIG.MOUSE_FACTOR;
            mouseInfluence.vy += dy * CONFIG.MOUSE_FACTOR; 
       }
       prevMouseX = e.clientX;
       prevMouseY = e.clientY;
   });
    document.addEventListener("mouseleave", function() {
      prevMouseX = null;
      prevMouseY = null;
   });
    document.addEventListener("mouseenter", function(e) {
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('load', () => {
      setup();
       requestAnimationFrame(animate);
     });
  
}();