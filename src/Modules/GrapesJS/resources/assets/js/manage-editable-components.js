(function() {

    /**
     * After loading the initial content of the page builder, restrict access to all layout components.
     * Only blocks and components inside the element with phpb-content-container attribute are editable.
     */
    window.editor.on('load', function(editor) {
        denyAccessToLayoutElements(editor.getWrapper());

        let container = editor.getWrapper().find("[phpb-content-container]")[0];

        // modify edit access of the content container
        container.set({
            droppable: true,
            hoverable: true,
            removable: false,
            copyable: false,
        });
        container.set('custom-name', window.translations['page-content']);

        // add all previously stored page components inside the content container
        container.components(window.pageComponents);
    });

    /**
     * Function for denying edit access to this component and all children that belong to the layout.
     *
     * @param component
     */
    function denyAccessToLayoutElements(component) {
        if ('phpb-content-container' in component.attributes.attributes) return;

        disableAllEditFunctionality(component);

        // apply restrictions to child components
        component.get('components').each(component => denyAccessToLayoutElements(component));
    }


    /**
     * On selecting a component, only show the copy/drag/remove toolbar if the component is draggable or removable.
     */
    window.editor.on('component:selected', function(component) {
        document.querySelector('.gjs-toolbar').classList.add('d-none');
        if (component.attributes.draggable || component.attributes.removable) {
            document.querySelector('.gjs-toolbar').classList.remove('d-none');
        }
    });

    window.editor.on('block:drag:stop', function(droppedComponent) {
        // ensure component drop was successful
        if (! droppedComponent) return;

        applyBlockAttributesToComponents(droppedComponent);
    });

    function applyBlockAttributesToComponents(component) {
        if (component.attributes.tagName === 'phpb-block') {
            // component is a <phpb-block> element needed to carry information to the components of the dragged block
            // replace the droppedComponent with its children while giving its children the attributes of droppedComponent
            let container = component.parent();
            let clone = component.clone();
            component.remove();
            let blockRootComponents = clone.components();
            blockRootComponents.each(function(blockRootComponent) {
                container.append(blockRootComponent);
            });

            blockRootComponents.each(function(blockRootComponent) {
                applyBlockAttributes(clone, blockRootComponent);

                let allowEditWhitelistedTags = clone.attributes.attributes['is-html'];
                restrictEditAccess(blockRootComponent, allowEditWhitelistedTags);

                // the droppedComponent itself should always be removable/draggable/copyable
                blockRootComponent.set({
                    removable: true,
                    draggable: true,
                    copyable: true,
                    layerable: true,
                    selectable: true,
                    hoverable: true,
                });

                // recursive call to replace <phpb-block> elements of the nested blocks (loaded via shortcodes)
                applyBlockAttributesToComponents(blockRootComponent);
            });
        }

        component.components().each(function(childComponent) {
            // recursive call to replace <phpb-block> elements of nested blocks (loaded via shortcodes)
            applyBlockAttributesToComponents(childComponent);
        });
    }

    /**
     * Apply the attributes of the given component to the given target component.
     *
     * @param phpbComponent
     * @param component
     */
    function applyBlockAttributes(phpbComponent, component) {
        let componentAttributes = phpbComponent.attributes.attributes;
        for (var attribute in componentAttributes) {
            if (componentAttributes.hasOwnProperty(attribute)) {
                component.attributes[attribute] = componentAttributes[attribute];
            }
        }
    }

    /**
     * Function for only allowing edit access on whitelisted components.
     *
     * @param component
     * @param allowEditWhitelistedTags
     */
    function restrictEditAccess(component, allowEditWhitelistedTags = false) {
        disableAllEditFunctionality(component);

        let isDynamicBlock = component.attributes.attributes['is-html'] === 'false';
        allowEditWhitelistedTags = allowEditWhitelistedTags && ! isDynamicBlock;

        // whether edit access should be allowed based on the html tag
        if (allowEditWhitelistedTags) {
            allowEditBasedOnTag(component);
        }
        allowEditBasedOnClass(component);

        // apply edit restrictions to child components
        component.get('components').each(component => restrictEditAccess(component, allowEditWhitelistedTags));
    }

    function allowEditBasedOnTag(component) {
        let htmlTag = component.get('tagName');
        let editableTags = [
            //'div','span',
            'h1','h2','h3','h4','h5','h6','h7',
            'p','a','img','button','small','b','strong','i','em',
            'ul','li','th','td'
        ];

        if (editableTags.includes(htmlTag)) {
            component.set({
                hoverable: true,
                selectable: true,
                editable: true,
            })
        }
    }

    function allowEditBasedOnClass(component) {
        if ('phpb-editable' in component.attributes.attributes) {
            component.set({
                hoverable: true,
                selectable: true,
                editable: true,
            })
        }
    }

    function disableAllEditFunctionality(component) {
        component.set({
            removable: false,
            draggable: false,
            droppable: false,
            badgable: false,
            stylable: false,
            highlightable: false,
            copyable: false,
            resizable: false,
            editable: false,
            layerable: false,
            selectable: false,
            hoverable: false
        });
    }

})();