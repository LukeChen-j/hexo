window.addEventListener("load", () => {
    const images = document.querySelectorAll(".l-gallery .l-image img");
    images.forEach(img => {
        img.style.display = "block";
        const path = img.getAttribute("path");
        if (path) {
            img.src = path;
            img.addEventListener("load", () => {
                img.style.opacity = "1";
            });
        }
    });
});
mixins.galleryLayout = {
    created() {
        this.renderers.push(this.initGalleryLayout);
    },
    mounted() {
        window.addEventListener('resize', this.handleResize);
    },
    methods: {
        initGalleryLayout() {
            this.initGalleryData();
        },
        initGalleryData() {
            const galleryElements = document.querySelectorAll('.l-gallery');
            galleryElements.forEach(galleryElement => {
                galleryElement.galleryWidth = galleryElement.offsetWidth;

                const imageElements = galleryElement.querySelectorAll('.l-image');
                imageElements.forEach(imageElement => {
                    imageElement.imageHeight = parseInt(imageElement.dataset.height);
                    imageElement.imageWidth = parseInt(imageElement.dataset.width);
                });

                this.adjustLayout(galleryElement);
            });
        },
        adjustLayout(gallery) {
			// 获取 l-gallery 元素下的所有 l-image 元素
			const imageElements = gallery.querySelectorAll('.l-image');
			const numImages = imageElements.length;

			// 设置临时变量
			let horizontalOffset = 0; // 设置横向布局偏移 = 0
			let verticalOffset = 0;   // 设置纵向布局偏移 = 0
			const layoutWidth = gallery.galleryWidth; // 设置布局宽度为galleryWidth
			let targetArea = 125000;   // 设置目标面积
			if (layoutWidth < 500)
				targetArea = 0.5 * layoutWidth * layoutWidth;
			const columnSpacing = 10;  // 设置行内间距为10 (这里我更倾向于使用 columnSpacing，更符合英文习惯)
			const rowSpacing = 10;     // 设置行间间距为10
			let totalHeight = verticalOffset - rowSpacing; // 设置总高度为 纵向布局偏移-1*行间间距
			let n = 0;               // 设置n=0

			while (n < numImages) { // while n<N: (这里 N 替换为 numImages)
				totalHeight = totalHeight + rowSpacing; // 总高度=总高度+行间间距
				let i = 0;         // i=0
				let ratio = 0;     // ratio=
				let finalRatio = 0;
				let area = 3 * targetArea; // area=3*目标面积
				let currentArea = 3 * targetArea; // currentArea=3*目标面积

				while (n + i < numImages) { // while n+i<nn: (这里 nn 替换为 numImages)
					const lImage = imageElements[n + i];
					ratio = ratio + lImage.imageWidth / lImage.imageHeight; // ratio=ratio+image[n+i].w/image[n+i].h
					currentArea = (layoutWidth - i * columnSpacing) * (layoutWidth - i * columnSpacing) / ratio / (i + 1); // currentArea=(布局宽度-i*行内间距)*(布局宽度-i*行内间距)/ratio/(i+1)
					if (currentArea < targetArea) { // if currentArea<目标面积:
						if ((targetArea - currentArea) < (area - targetArea)){ // if (目标面积-currentArea)<(area-目标面积)
							i = i + 1; // i=i+1
							finalRatio = ratio;
						}
						break; // break
					}
					area = currentArea; // area=currentArea
					i = i + 1;         // i=i+1
					finalRatio = ratio
				}

				let h = (layoutWidth - (i - 1) * columnSpacing) / finalRatio; // h=(布局宽度-(i-1)*行内间距)/ratio
				if ((n + i === numImages) && (currentArea > targetArea)) // if (n+i==nn)并且(currentArea>目标面积) (这里 nn 替换为 numImages)
					h = Math.sqrt(i * targetArea / finalRatio); // h=sqrt(i*目标面积/ratio)

				let x = horizontalOffset; // x=横向布局偏移
				for (let j = 0; j < i; j++) { // while j<i:
					const lImage = imageElements[n + j];
					const w = h * lImage.imageWidth / lImage.imageHeight; // w=h*image[n+j].w/image[n+j].h
					// 设置image[n+j]的style中的left为x像素、top为总高度像素、height为h像素、width为w像素
					lImage.style.left = `${x}px`;
					lImage.style.top = `${totalHeight}px`;
					lImage.style.height = `${h}px`;
					lImage.style.width = `${w}px`;
					x = x + w + columnSpacing; // x=x+w+行内间距
				}
				totalHeight = totalHeight + h; // 总高度=总高度+h
				n = n + i; // n 增加 i，处理下一行图片
			}

			gallery.style.height = `${totalHeight}px`; // 设置l-gallery的style中的height为总高度像素
			gallery.style.position = 'relative'; // 确保 l-gallery 相对定位，以便内部 l-image 绝对定位正确
		},
        handleResize() {
            const galleryElements = document.querySelectorAll('.l-gallery');
            galleryElements.forEach(galleryElement => {
                const currentWidth = galleryElement.offsetWidth;
                if (currentWidth !== galleryElement.galleryWidth) {
                    galleryElement.galleryWidth = currentWidth;
                    this.adjustLayout(galleryElement);
                }
            });
        },
    },
};

