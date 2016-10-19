TW.IDE.Widgets.Burndown = function () {

    this.widgetIconUrl = function() {
        return  "./BlockedTasks.ide.png";
    };
    this.widgetProperties = function () {
        return {
            'name': 'Burndown',
            'description': 'Burndown widget',
            'category': ['Common'],
            'needsDataLoadingAndError': true,
            'ShowDataLoading': true,
            'isResizable': true,
            'supportsAutoResize': true,
            'iconImage': 'BlockedTasks.ide.png',
            'properties': {
                 'Data': {
                     'description': 'Data source',
                     'isBindingTarget': true,
                     'isEditable': false,
                     'baseType': 'INFOTABLE',
                     'warnIfNotBoundAsTarget': true
                 }
            }
        }

    }
    this.validate = function () {
        var result = [];

        return result;
    };

    this.renderHtml = function () {
        var html = '';
        html +=
            '<div class="widget-content widget-Burndown">Burndown chart</div>';
        return html;
    };

    this.widgetEvents = function () {
        return {
            'OnDataChanged': {
                'description': 'Event fired when data has been changed'
            }
        };
    };

    this.widgetServices = function() {
        return {
            'ReRenderBlockedTasks': {
                'description': 'Call this service to re-render the latest activity component',
                'warnIfNotBound': false
            }
        };
    };

    this.afterSetProperty = function (name, value) {
      return true;
    };
}
