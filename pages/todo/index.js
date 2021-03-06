//index.js
//获取应用实例
const utils = require('../../utils/util.js')
const app = getApp()
const actionMenu1 = ["完成", "删除"]
const actionMenu2 = ["完成", "删除", "取消"]
let that
let page = 1
let isLastPage = false

Page({
  data: {
    curIndex: 0,
    todoList: [],
    showLoadMore: false,
    showData: true
  },

  onLoad: function() {
    wx.showLoading({
      title: '加载中...',
    })
    that = this
  },

  onShow: function(){
    that.updateList()
  },

  bindTab: function(e) {

    if (!app.globalData.isLogin) {
      utils.showLoginTip()
      return
    }

    let index = e.currentTarget.dataset.index
    if (index != this.data.curIndex) {
      this.setData({
        curIndex: index
      })
      wx.showLoading({
        title: '加载中...',
      })
      this.updateList()
    }
  },

  bindEdit: function(e) {

    if (!app.globalData.isLogin) {
      utils.showLoginTip()
      return
    }

    let id = e.currentTarget.dataset.id
    wx.getSystemInfo({
      success: function(result) {
        let tempMenu
        if (result.platform == 'android') {
          tempMenu = actionMenu2
        } else {
          tempMenu = actionMenu1
        }

        wx.showActionSheet({
          itemList: tempMenu,
          success(res) {
            if (res.tapIndex == 0) {
              //标记完成
              that.updateTodoStatus(id)
            } else if (res.tapIndex == 1) {
              //删除
              wx.showModal({
                title: '提示',
                content: '您真的要删除吗?',
                confirmColor: '#0091ea',
                success(res) {
                  if (res.confirm) {
                    that.deleteTodo(id)
                  }
                }
              })
            } else {
              //取消
            }
          },
        })


      }
    })

  },

  bindActionSheetChange: function(e) {
    this.showActionSheet(true)
  },
  bindDone: function() {
    this.showActionSheet(true)
  },

  bindDelete: function() {
    this.showActionSheet(true)
  },

  bindToAdd: function() {
    if (!app.globalData.isLogin){
      utils.showLoginTip()
      return
    }

    wx.navigateTo({
      url: '/pages/add/index?type=' + this.data.curIndex,
    })
  },

  bindItem: function(e) {

    if (!app.globalData.isLogin) {
      utils.showLoginTip()
      return
    }

    let todo = e.currentTarget.dataset.item
    todo.title = encodeURIComponent(todo.title)
    todo.content = encodeURIComponent(todo.content)
   let todo2 = JSON.stringify(todo)
    wx.navigateTo({
      url: '/pages/edit/index?status=0&type=' + this.data.curIndex + '&todo=' + todo2,
    })
  },

  /**
   * 获取未完成Todo清单
   */
  getTodoList: function() {
    let params = {
      status: 0,
      type: this.data.curIndex,
    }

    utils.doRequest(
      `lg/todo/v2/list/${page}/json`,
      'GET',
      params,
      function(res) {
        let tempList
        if(page == 1){
          //刷新
          tempList = []
          res.datas.forEach(function (item, index) {
            if (index == 0 || item.date != res.datas[index - 1].date) {
              let list = {
                date: '',
                datas: []
              }
              list.date = item.date
              list.datas.push(item)
              tempList.push(list)
            } else {
              tempList.forEach(function (tempItem) {
                if (tempItem.date == item.date) {
                  tempItem.datas.push(item)
                }
              })
            }
          })

          if(tempList.length > 0){
            that.setData({
              showData: true
            })
          }else {
            that.setData({
              showData: false
            })
          }
        }else {
          //加载更多
          tempList = that.data.todoList
          res.datas.forEach(function(item,index){
            if(item.date == tempList[tempList.length - 1].date){
              tempList[tempList.length - 1].datas.push(item)
            }else {
              let list = {
                date: '',
                datas: []
              }
              list.date = item.date
              list.datas.push(item)
              tempList.push(list)
            }
          })
        }
        isLastPage = res.over
        if(isLastPage){
          that.setData({
            todoList: tempList,
            showLoadMore: false,
          })
        }else {
          that.setData({
            todoList: tempList,
            showLoadMore: true
          })
        }
      },null,
      function(){
        wx.hideLoading()
        wx.stopPullDownRefresh()
      })
  },

  /**
   * 更新当前Todo完成状态
   */
  updateTodoStatus: function(id) {

    let params = {
      status: 1
    }
    utils.doRequest(
      `lg/todo/done/${id}/json`,
      'POST',
      params,
      function(res) {
        //刷新列表
        that.getTodoList()
        wx.showToast({
          title: '已完成'
        })
      }
    )
  },

  /**
   * 删除Todo
   */
  deleteTodo: function(id) {
    utils.doRequest(
      `lg/todo/delete/${id}/json`,
      'POST',
      null,
      function(res) {
        wx.showToast({
          title: '已删除'
        })
        that.updateList()
      }
    )
  },

  updateList: function(){
    page = 1
    this.getTodoList()
  },

  onPullDownRefresh: function(){
    this.updateList()
  },

  onReachBottom: function(){
    if (isLastPage) {
        return
    }
    page++
    this.getTodoList()
  },

})