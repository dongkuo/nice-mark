import {Component, OnInit} from '@angular/core';
import {Tab} from  './tab'

/**
 * 选项卡组件
 */
@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css']
})
export class TabComponent implements OnInit {

  tabs: Array<Tab> = [];
  selectedTab: Tab;
  scrollOffset = 0;

  constructor() {
  }

  ngOnInit() {
    for (let i = 0; i < 10; i++) {
      this.tabs.push(new Tab("测试啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦v啦.md" + i, i == 6));
    }
    if (this.tabs.length > 0) {
      this.selectedTab = this.tabs[0];
      this.selectedTab.selected = true;
    }
    this.tabs[1].theme = 'warning';
  }


  /**
   * 添加tab
   * @param name
   */
  addTab(name: String) {
    this.tabs.push(new Tab(name, ''));
    this.selectTab(this.tabs.length - 1);
  }

  /**
   * 删除tab
   * @param index 要删除的tab的索引
   */
  deleteTab(index: number) {
    let isDeleteSelected = this.tabs[index] == this.selectedTab;
    this.tabs.splice(index, 1);
    if (isDeleteSelected) {
      if (this.tabs.length == 0) {
        this.selectedTab = null;
      } else {
        this.selectTab(this.tabs.length - 1);
      }
    }
  }

  /**
   * 修改tab
   * @param index 要修改的tab的索引
   * @param newTab 新tab
   */
  updateTab(index: number, newTab: Tab) {
    let oldTab = this.tabs[index];
    for (let key in newTab) {
      oldTab[key] = newTab[key];
    }
  }

  /**
   * 调节tab视图，保证其完全可见
   * @param tabBounds "{left: tab.offsetLeft, right: tab.offsetLeft + tab.offsetWidth}"
   * @param scrollOffset tab组件水平滚动偏移量
   * @param componentWidth tab组件的总宽度
   */
  adjustTab(tabBounds, scrollOffset, componentWidth) {
    if (!tabBounds) return;
    let offset = 0;
    let wOffsetLeft = tabBounds[0] - scrollOffset;
    let wOffsetRight = tabBounds[1] - scrollOffset;
    if (wOffsetLeft < 0) {
      offset = wOffsetLeft;
    } else if (wOffsetRight > componentWidth) {
      offset = wOffsetRight - componentWidth;
    }
    this.scrollOffset = scrollOffset + offset;
  }

  /**
   * 选中某个tab
   * @param index
   * @param tabBounds
   * @param scrollOffset
   * @param componentWidth
   */
  selectTab(index: number, tabBounds = null, scrollOffset = 0, componentWidth = 0) {
    // 更新tab状态
    if(this.selectedTab){
      this.selectedTab.selected = false;
    }
    this.selectedTab = this.tabs[index];
    this.selectedTab.selected = true;
    if (index == this.tabs.length - 1) {
      this.scrollOffset = this.scrollOffset == 999999999 ? 999999998 : 999999999;
      return;
    }
    this.adjustTab(tabBounds, scrollOffset, componentWidth);
  }

  setScrollOffset(scrollOffset) {
    this.scrollOffset = scrollOffset;
  }
}
